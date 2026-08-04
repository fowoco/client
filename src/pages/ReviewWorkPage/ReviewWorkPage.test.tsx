import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
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

function renderPage(aiRun?: AiRunResponse) {
  render(
    <MemoryRouter initialEntries={[aiRun ? { pathname: '/tasks/new/review', state: { aiRun } } : '/tasks/new/review']}>
      <ReviewWorkPage />
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
        { slot_key: 'due_at', label: '신청 목표일을 입력해 주세요.', input_type: 'DATE', required: true, answer: null },
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
})
