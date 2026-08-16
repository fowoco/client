import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiRunResponse } from '../../api/aiRuns'
import { AiRunReview } from './AiRunReview'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

const RUN: AiRunResponse = {
  ai_run_id: 'A-1',
  request_id: 'R-1',
  instruction: '응웬반A 체류기간 연장과 급여 자료를 확인해 주세요',
  status: 'SUCCEEDED',
  analysis_outcome: 'REVIEW_REQUIRED',
  detected_intent: 'EXPIRY_RENEWAL',
  evidence: null,
  error_code: null,
  attempt_count: 1,
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
  created_at: '2026-08-08T00:00:00Z',
  updated_at: '2026-08-08T00:00:01Z',
}

const CATALOG = {
  bundle_id: 'bundle-1',
  bundle_version: '1',
  bundle_status: 'ACTIVE',
  source_repository: 'fowoco/knowledge',
  generated_at: '2026-08-08T00:00:00Z',
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

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => vi.unstubAllGlobals())

function processingRun(): AiRunResponse {
  return {
    ...RUN,
    status: 'RUNNING',
    analysis_outcome: null,
    detected_intent: null,
    evidence: null,
    version: 1,
    questions: [],
    candidates: [],
  }
}

function needsInfoRun(): AiRunResponse {
  return {
    ...processingRun(),
    status: 'SUCCEEDED',
    analysis_outcome: 'NEEDS_INFO',
    detected_intent: 'EXPIRY_RENEWAL',
    evidence: null,
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
  }
}

function renderProcessingReview() {
  render(
    <MemoryRouter>
      <AiRunReview initialRun={processingRun()} />
    </MemoryRouter>,
  )
}

function eventStream(event: unknown) {
  const payload = `id:2\nevent:NEEDS_INFO\ndata:${JSON.stringify(event)}\n\n`
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(payload))
      controller.close()
    },
  })
}

function renderReview() {
  render(
    <MemoryRouter initialEntries={['/tasks/new/review']}>
      <Routes>
        <Route path="/tasks/new/review" element={<AiRunReview initialRun={RUN} />} />
        <Route path="/tasks/:taskId" element={<p>생성된 업무 상세</p>} />
        <Route path="/tasks" element={<p>업무함</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AiRunReview candidate decision', () => {
  it('accepts one candidate, discards the others, and opens the created task', async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.includes('/workflow-catalogs')) return Promise.resolve(jsonResponse(CATALOG))
      if (url.includes('/workers')) {
        return Promise.resolve(
          jsonResponse({
            items: [{ worker_id: 'W-1', display_name: '응웬반A' }],
            page: 0,
            size: 100,
            total_elements: 1,
          }),
        )
      }
      if (url.includes('/candidate-decisions')) {
        return Promise.resolve(
          jsonResponse({
            decision_batch_id: 'BATCH-1',
            ai_run_id: RUN.ai_run_id,
            case_id: 'CASE-1',
            task_ids: ['TASK-1'],
            decisions: [
              { candidate_id: 'C-1', action: 'ACCEPT' },
              { candidate_id: 'C-2', action: 'DISCARD' },
            ],
            run_version: 4,
          }),
        )
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })
    const user = userEvent.setup()
    renderReview()

    expect(screen.getByText('선택 필요')).toBeInTheDocument()
    const createButton = screen.getByRole('button', { name: '선택한 업무 생성' })
    expect(createButton).toBeDisabled()

    const candidateButton = await screen.findByRole('button', {
      name: '체류기간 연장 처리 선택',
    })
    await user.click(candidateButton)
    expect(screen.getByText('1개 선택')).toBeInTheDocument()
    expect(createButton).toBeEnabled()

    await user.click(createButton)

    expect(await screen.findByText('생성된 업무 상세')).toBeInTheDocument()
    const decisionCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes('/candidate-decisions'))
    expect(new Headers(decisionCall?.[1]?.headers).get('Idempotency-Key')).toBeTruthy()
    expect(JSON.parse(String(decisionCall?.[1]?.body))).toEqual({
      expected_run_version: 3,
      decisions: [
        { candidate_id: 'C-1', action: 'ACCEPT' },
        { candidate_id: 'C-2', action: 'DISCARD' },
      ],
    })
  })

  it('does not allow a candidate with missing slots to be selected', async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.includes('/workflow-catalogs')) return Promise.resolve(jsonResponse(CATALOG))
      if (url.includes('/workers')) {
        return Promise.resolve(jsonResponse({ items: [], page: 0, size: 100, total_elements: 0 }))
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })
    render(
      <MemoryRouter>
        <AiRunReview
          initialRun={{
            ...RUN,
            candidates: [{ ...RUN.candidates[0], missing_slots: ['due_at'] }],
          }}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('button', { name: '체류기간 연장 처리 선택' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '선택한 업무 생성' })).toBeDisabled()
  })
})

describe('AiRunReview 분석 근거', () => {
  function mockCatalogAndWorkers() {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.includes('/workflow-catalogs')) return Promise.resolve(jsonResponse(CATALOG))
      if (url.includes('/workers')) {
        return Promise.resolve(jsonResponse({ items: [], page: 0, size: 100, total_elements: 0 }))
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })
  }

  it('renders the evidence text returned by the API', async () => {
    mockCatalogAndWorkers()
    render(
      <MemoryRouter>
        <AiRunReview initialRun={{ ...RUN, evidence: '체류만료일이 30일 이내로 확인됨' }} />
      </MemoryRouter>,
    )

    expect(await screen.findByText('체류만료일이 30일 이내로 확인됨')).toBeInTheDocument()
  })

  it('falls back to a placeholder when the API has no evidence yet', async () => {
    mockCatalogAndWorkers()
    render(
      <MemoryRouter>
        <AiRunReview initialRun={{ ...RUN, evidence: null }} />
      </MemoryRouter>,
    )

    expect(await screen.findByText('현재 분석 API에서 제공하지 않음')).toBeInTheDocument()
  })
})

describe('AiRunReview progress updates', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses a terminal SSE event to fetch the complete questions and candidates', async () => {
    const terminalEvent = {
      event_id: 2,
      ai_run_id: RUN.ai_run_id,
      type: 'NEEDS_INFO',
      status: 'SUCCEEDED',
      analysis_outcome: 'NEEDS_INFO',
      attempt_count: 1,
      version: 2,
      occurred_at: '2026-08-09T00:00:02Z',
    }
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.includes('/events')) {
        return Promise.resolve(
          new Response(eventStream(terminalEvent), {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream' },
          }),
        )
      }
      if (url.includes(`/ai-runs/${RUN.ai_run_id}`)) {
        return Promise.resolve(jsonResponse(needsInfoRun()))
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })

    renderProcessingReview()

    expect(await screen.findByLabelText('신청 목표일을 입력해 주세요. *')).toBeInTheDocument()
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes('/events'))).toBe(true)
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(([url]) => String(url).endsWith(`/ai-runs/${RUN.ai_run_id}`)),
    ).toBe(true)
  })

  it('falls back to the existing polling endpoint when the SSE connection fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.includes('/events')) return Promise.reject(new TypeError('stream disconnected'))
      if (url.includes(`/ai-runs/${RUN.ai_run_id}`)) {
        return Promise.resolve(jsonResponse(needsInfoRun()))
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })
    renderProcessingReview()

    await waitFor(() =>
      expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes('/events'))).toBe(
        true,
      ),
    )
    await vi.advanceTimersByTimeAsync(1300)

    expect(await screen.findByLabelText('신청 목표일을 입력해 주세요. *')).toBeInTheDocument()
  })

  it('polls while an SSE connection stays open without delivering an event', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.includes('/events')) return new Promise<Response>(() => undefined)
      if (url.includes(`/ai-runs/${RUN.ai_run_id}`)) {
        return Promise.resolve(jsonResponse(needsInfoRun()))
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })
    renderProcessingReview()

    await vi.advanceTimersByTimeAsync(1300)

    expect(await screen.findByLabelText('신청 목표일을 입력해 주세요. *')).toBeInTheDocument()
  })
})
