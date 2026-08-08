import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiRunResponse } from '../../api/aiRuns'
import type { WorkRequestDraft } from '../CreateWorkPage/workRequestDraft'
import { ReviewWorkPage } from './ReviewWorkPage'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

const CATALOG = {
  bundle_id: 'B-1',
  bundle_version: '1',
  bundle_status: 'ACTIVE',
  source_repository: 'fowoco/knowledge',
  generated_at: '2026-08-04T00:00:00Z',
  workflows: [
    {
      workflow_id: 'WF-STY-001',
      name: '체류기간 연장 처리',
      intent: 'EXPIRY_RENEWAL',
      sensitivity: 'NORMAL',
      supported_task_types: [],
      required_slots: [],
      checklist_items: [],
      completion_evidence: [],
      source_ids: [],
    },
    {
      workflow_id: 'WF-PAY-001',
      name: '급여 자료 확인',
      intent: 'PAYROLL_EXPLANATION',
      sensitivity: 'NORMAL',
      supported_task_types: [],
      required_slots: [],
      checklist_items: [],
      completion_evidence: [],
      source_ids: [],
    },
  ],
}
const WORKERS = {
  items: [{ worker_id: 'W-1', display_name: '응웬반A' }],
  page: 0,
  size: 100,
  total_elements: 1,
}

function needsInfoRun(overrides: Partial<AiRunResponse> = {}): AiRunResponse {
  return {
    ai_run_id: 'A-1',
    request_id: 'R-1',
    instruction: '응웬반A 체류연장 준비해줘',
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
    ...overrides,
  }
}

const DRAFT: WorkRequestDraft = {
  request: '응웬반A 체류연장 준비해줘',
  mode: 'nl',
  workerId: 'W-1',
  attachments: [],
}

beforeEach(() => {
  window.sessionStorage.clear()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderPage(aiRun?: AiRunResponse, path = '/tasks/new/review', draft?: WorkRequestDraft) {
  render(
    <MemoryRouter initialEntries={[aiRun ? { pathname: path, state: { aiRun, draft } } : path]}>
      <Routes>
        <Route path="/tasks/new/review" element={<ReviewWorkPage />} />
        <Route path="/tasks/:taskId" element={<p>생성된 업무 상세</p>} />
        <Route path="/tasks" element={<p>업무함</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ReviewWorkPage', () => {
  it('does not show static example data without an analysis run', () => {
    renderPage()

    expect(screen.getByText('검토할 분석 결과가 없습니다.')).toBeInTheDocument()
    expect(screen.getByText(/예시 업무는 표시하지 않습니다/)).toBeInTheDocument()
  })

  it('renders the exact request with Korean intent and review steps', () => {
    renderPage(needsInfoRun(), undefined, DRAFT)

    expect(screen.getByText(DRAFT.request)).toBeInTheDocument()
    expect(screen.getByText('체류기간 연장')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByText('현재 분석 API에서 제공하지 않음')).toBeInTheDocument()
  })

  it('submits missing information and renders server-backed candidate labels', async () => {
    const completedRun = needsInfoRun({
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
    })
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.includes('/answers'))
        return Promise.resolve(jsonResponse(completedRun, { status: 202 }))
      if (url.includes('/workflow-catalogs')) return Promise.resolve(jsonResponse(CATALOG))
      if (url.includes('/workers')) return Promise.resolve(jsonResponse(WORKERS))
      return Promise.resolve(jsonResponse(completedRun))
    })
    const user = userEvent.setup()
    renderPage(needsInfoRun(), undefined, DRAFT)

    await user.type(screen.getByLabelText('신청 목표일을 입력해 주세요. *'), '2026-08-31')
    await user.click(screen.getByRole('button', { name: '답변하고 다시 분석' }))

    expect((await screen.findAllByText('체류기간 연장 처리')).length).toBeGreaterThan(0)
    expect(screen.getByText('응웬반A')).toBeInTheDocument()
    expect(screen.queryByText('0.96')).not.toBeInTheDocument()
    const answerCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes('/answers'))
    expect(JSON.parse((answerCall?.[1] as RequestInit).body as string)).toEqual({
      expected_version: 2,
      answers: { due_at: '2026-08-31' },
    })
  })

  it('accepts one candidate, discards the others, and opens the created task', async () => {
    const compoundRun = needsInfoRun({
      analysis_outcome: 'REVIEW_REQUIRED',
      questions: [],
      candidates: [
        {
          candidate_id: 'C-1',
          candidate_ref: 'candidate-1',
          worker_id: 'W-1',
          workflow_id: 'WF-STY-001',
          extracted_slots: { due_at: '2026-08-31' },
          missing_slots: [],
          confidence: 0.92,
        },
        {
          candidate_id: 'C-2',
          candidate_ref: 'candidate-2',
          worker_id: 'W-1',
          workflow_id: 'WF-PAY-001',
          extracted_slots: {},
          missing_slots: [],
          confidence: 0.72,
        },
      ],
    })
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.includes('/workflow-catalogs')) return Promise.resolve(jsonResponse(CATALOG))
      if (url.includes('/workers')) return Promise.resolve(jsonResponse(WORKERS))
      if (url.includes('/candidate-decisions')) {
        return Promise.resolve(
          jsonResponse({
            decision_batch_id: 'BATCH-1',
            ai_run_id: compoundRun.ai_run_id,
            case_id: 'CASE-1',
            task_ids: ['TASK-1'],
            decisions: [
              { candidate_id: 'C-1', action: 'ACCEPT' },
              { candidate_id: 'C-2', action: 'DISCARD' },
            ],
            run_version: 3,
          }),
        )
      }
      return Promise.resolve(jsonResponse(compoundRun))
    })
    const user = userEvent.setup()
    renderPage(compoundRun, undefined, DRAFT)

    expect(screen.getByText('2개의 업무를 찾았습니다.')).toBeInTheDocument()
    expect(screen.getByText('선택 필요')).toBeInTheDocument()
    const createButton = screen.getByRole('button', { name: '선택한 업무 생성' })
    expect(createButton).toBeDisabled()

    await waitFor(() => expect(screen.getAllByText('급여 자료 확인').length).toBeGreaterThan(0))
    await user.click(screen.getByRole('button', { name: '체류기간 연장 처리 선택' }))

    expect(screen.getByText('1개 선택')).toBeInTheDocument()
    expect(createButton).toBeEnabled()
    await user.click(createButton)

    expect(await screen.findByText('생성된 업무 상세')).toBeInTheDocument()
    const decisionCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes('/candidate-decisions'))
    expect(JSON.parse(String(decisionCall?.[1]?.body))).toEqual({
      expected_run_version: 2,
      decisions: [
        { candidate_id: 'C-1', action: 'ACCEPT' },
        { candidate_id: 'C-2', action: 'DISCARD' },
      ],
    })
  })

  it('retries a failed analysis with the unchanged original request', async () => {
    const failedRun = needsInfoRun({
      status: 'FAILED',
      analysis_outcome: null,
      questions: [],
      error_code: 'AI_RUNTIME_FAILED',
    })
    const retriedRun = needsInfoRun({ ai_run_id: 'A-2', attempt_count: 1, version: 1 })
    vi.mocked(fetch).mockResolvedValue(jsonResponse(retriedRun, { status: 202 }))
    const user = userEvent.setup()
    renderPage(failedRun, undefined, DRAFT)

    await user.click(screen.getByRole('button', { name: '같은 요청 다시 분석' }))

    await waitFor(() => {
      const retryCall = vi
        .mocked(fetch)
        .mock.calls.find(([url]) => String(url).endsWith('/ai-runs'))
      expect(JSON.parse((retryCall?.[1] as RequestInit).body as string)).toEqual({
        instruction: DRAFT.request,
      })
    })
  })

  it('restores the AI run from the URL after a refresh', async () => {
    const savedRun = needsInfoRun({
      ai_run_id: 'A-RESTORED',
      request_id: 'R-RESTORED',
      attempt_count: 1,
      version: 1,
    })
    vi.mocked(fetch).mockResolvedValue(jsonResponse(savedRun))

    renderPage(undefined, '/tasks/new/review?aiRunId=A-RESTORED')

    expect(screen.getByText('Agent 분석 결과를 불러오고 있습니다.')).toBeInTheDocument()
    expect(await screen.findByText(savedRun.instruction)).toBeInTheDocument()
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/ai-runs/A-RESTORED')
  })
})
