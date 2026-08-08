import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiRunResponse } from '../../api/aiRuns'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { ReviewWorkPage } from './ReviewWorkPage'
import {
  DRAFT_REASONS,
  MISSING_INFO,
  PREPARED_CHECKLIST,
  PREPARED_DRAFT,
  REVIEW_STEPS,
  UNDERSTOOD_REQUEST,
} from './reviewWorkData'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderPage(aiRun?: AiRunResponse, path = '/tasks/new/review') {
  render(
    <MemoryRouter initialEntries={[aiRun ? { pathname: path, state: { aiRun } } : path]}>
      <Routes>
        <Route path="/tasks/new/review" element={<ReviewWorkPage />} />
        <Route path="/tasks/:taskId" element={<p>생성된 업무 상세</p>} />
        <Route path="/tasks" element={<p>업무함</p>} />
      </Routes>
      <ToastViewport />
    </MemoryRouter>,
  )
}

describe('ReviewWorkPage', () => {
  it('renders the understood request and prepared draft', () => {
    renderPage()
    expect(screen.getByText(UNDERSTOOD_REQUEST.purpose)).toBeInTheDocument()
    expect(screen.getByText(PREPARED_DRAFT.rows[0].value)).toBeInTheDocument()
  })

  it('disables create button until the missing institution is selected', async () => {
    const user = userEvent.setup()
    renderPage()

    const create = screen.getByRole('button', { name: '정보 확인 후 업무 생성' })
    expect(create).toBeDisabled()

    await user.click(screen.getByRole('button', { name: MISSING_INFO.placeholder }))
    await user.click(screen.getByRole('option', { name: MISSING_INFO.options[0] }))

    expect(create).toBeEnabled()
  })

  it('shows a toast when a draft is saved', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '초안 저장' }))

    expect(screen.getByText('초안을 저장했습니다.')).toBeInTheDocument()
  })

  it('renders every step of the progress indicator', () => {
    renderPage()
    expect(screen.getAllByRole('listitem')).toHaveLength(REVIEW_STEPS.length)
    for (const step of REVIEW_STEPS) {
      expect(screen.getAllByText(step.label).length).toBeGreaterThan(0)
    }
  })

  it('renders the AI checklist and draft reasoning', () => {
    renderPage()
    for (const item of PREPARED_CHECKLIST) {
      expect(screen.getByText(item)).toBeInTheDocument()
    }
    for (const reason of DRAFT_REASONS) {
      expect(screen.getByText(`· ${reason}`)).toBeInTheDocument()
    }
  })

  it('shows a toast when viewing evidence', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '근거 보기 ▾' }))

    expect(screen.getByText('분석 근거 보기는 준비 중입니다.')).toBeInTheDocument()
  })

  it('submits missing information and renders the returned candidate', async () => {
    const initialRun: AiRunResponse = {
      ai_run_id: 'A-1',
      request_id: 'R-1',
      instruction: '응웬반A 체류연장 준비해줘, EXPIRY_RENEWAL',
      status: 'SUCCEEDED',
      analysis_outcome: 'NEEDS_INFO',
      detected_intent: 'EXPIRY_RENEWAL',
      error_code: null,
      attempt_count: 2,
      version: 2,
      questions: [
        {
          slot_key: 'due_at',
          label: '신청 목표일을 입력해 주세요.',
          input_type: 'DATE',
          required: true,
          answer: null,
        },
      ],
      candidates: [],
      created_at: '2026-08-04T00:00:00Z',
      updated_at: '2026-08-04T00:00:01Z',
    }
    const completedRun: AiRunResponse = {
      ...initialRun,
      analysis_outcome: 'REVIEW_REQUIRED',
      attempt_count: 3,
      version: 3,
      questions: [],
      candidates: [
        {
          candidate_id: 'C-1',
          candidate_ref: 'candidate-1',
          worker_id: 'W-1',
          workflow_id: 'WF-STY-001',
          extracted_slots: { due_at: '2026-08-31' },
          missing_slots: [],
          confidence: 0.96,
        },
      ],
    }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(completedRun, { status: 202 }))
    const user = userEvent.setup()
    renderPage(initialRun)

    await user.type(screen.getByLabelText('신청 목표일을 입력해 주세요. *'), '2026-08-31')
    await user.click(screen.getByRole('button', { name: '답변하고 다시 분석' }))

    expect(await screen.findByText('WF-STY-001')).toBeInTheDocument()
    const answerCall = vi.mocked(fetch).mock.calls[0]
    expect(String(answerCall[0])).toContain('/ai-runs/A-1/answers')
    expect(JSON.parse((answerCall[1] as RequestInit).body as string)).toEqual({
      expected_version: 2,
      answers: { due_at: '2026-08-31' },
    })
  })

  it('restores the AI run from the URL after a refresh', async () => {
    const savedRun: AiRunResponse = {
      ai_run_id: 'A-RESTORED',
      request_id: 'R-RESTORED',
      instruction: '응웬반A 체류연장 준비해줘, EXPIRY_RENEWAL',
      status: 'SUCCEEDED',
      analysis_outcome: 'NEEDS_INFO',
      detected_intent: 'EXPIRY_RENEWAL',
      error_code: null,
      attempt_count: 1,
      version: 1,
      questions: [
        {
          slot_key: 'due_at',
          label: '신청 목표일을 입력해 주세요.',
          input_type: 'DATE',
          required: true,
          answer: null,
        },
      ],
      candidates: [],
      created_at: '2026-08-04T00:00:00Z',
      updated_at: '2026-08-04T00:00:01Z',
    }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(savedRun))

    renderPage(undefined, '/tasks/new/review?aiRunId=A-RESTORED')

    expect(screen.getByText('Agent 분석 결과를 불러오고 있습니다.')).toBeInTheDocument()
    expect(await screen.findByText(savedRun.instruction)).toBeInTheDocument()
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/ai-runs/A-RESTORED')
  })

  it('accepts one ready candidate, discards the others, and opens the created task', async () => {
    const reviewRun: AiRunResponse = {
      ai_run_id: 'A-DECISION',
      request_id: 'R-DECISION',
      instruction: '응웬반A 체류기간 연장 준비',
      status: 'SUCCEEDED',
      analysis_outcome: 'REVIEW_REQUIRED',
      detected_intent: 'EXPIRY_RENEWAL',
      error_code: null,
      attempt_count: 1,
      version: 3,
      questions: [],
      candidates: [
        {
          candidate_id: 'CAND-1',
          candidate_ref: 'candidate-1',
          worker_id: 'W-1',
          workflow_id: 'WF-1',
          extracted_slots: { due_at: '2026-08-20' },
          missing_slots: [],
          confidence: null,
        },
        {
          candidate_id: 'CAND-2',
          candidate_ref: 'candidate-2',
          worker_id: 'W-1',
          workflow_id: 'WF-2',
          extracted_slots: {},
          missing_slots: ['due_at'],
          confidence: null,
        },
      ],
      created_at: '2026-08-08T00:00:00Z',
      updated_at: '2026-08-08T00:00:01Z',
    }
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        decision_batch_id: 'BATCH-1',
        ai_run_id: 'A-DECISION',
        case_id: 'CASE-1',
        task_ids: ['TASK-1'],
        decisions: [
          { candidate_id: 'CAND-1', action: 'ACCEPT' },
          { candidate_id: 'CAND-2', action: 'DISCARD' },
        ],
        run_version: 4,
      }),
    )
    const user = userEvent.setup()
    renderPage(reviewRun)

    const createButton = screen.getByRole('button', { name: '선택한 업무 생성' })
    expect(createButton).toBeDisabled()
    expect(screen.getByRole('button', { name: 'candidate-2 이 후보 선택' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'candidate-1 이 후보 선택' }))
    expect(createButton).toBeEnabled()
    await user.click(createButton)

    expect(await screen.findByText('생성된 업무 상세')).toBeInTheDocument()
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/ai-runs/A-DECISION/candidate-decisions')
    expect(JSON.parse(String(init?.body))).toEqual({
      expected_run_version: 3,
      decisions: [
        { candidate_id: 'CAND-1', action: 'ACCEPT' },
        { candidate_id: 'CAND-2', action: 'DISCARD' },
      ],
    })
  })
})
