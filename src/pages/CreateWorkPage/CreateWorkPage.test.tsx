import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { CreateWorkPage } from './CreateWorkPage'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init })
}

function errorResponse(status: number, code: string, message: string) {
  return jsonResponse(
    { timestamp: '2026-07-27T01:23:45Z', status, code, message, path: '/api/v1/tasks', request_id: 'req-1', field_errors: [] },
    { status },
  )
}

const WORKER_PAGE = { items: [{ worker_id: 'W-1', display_name: '응웬반A' }], page: 0, size: 100, total_elements: 1 }
const CATALOG = {
  bundle_id: 'b-1',
  bundle_version: '1',
  bundle_status: 'ACTIVE',
  source_repository: 'fowoco/knowledge',
  generated_at: '2026-07-01T00:00:00Z',
  workflows: [
    {
      workflow_id: 'wf-stay-extension',
      name: '체류기간 연장 처리',
      intent: '체류기간 연장',
      sensitivity: 'NORMAL',
      supported_task_types: ['STAY_PERIOD_EXTENSION'],
      required_slots: ['접수번호'],
      checklist_items: [],
      completion_evidence: [],
      source_ids: [],
    },
  ],
}
const AI_RUN = {
  ai_run_id: 'A-1',
  request_id: 'R-1',
  instruction: '체류연장 준비, EXPIRY_RENEWAL',
  status: 'SUCCEEDED',
  analysis_outcome: 'NEEDS_INFO',
  detected_intent: 'EXPIRY_RENEWAL',
  error_code: null,
  attempt_count: 2,
  version: 2,
  questions: [{ slot_key: 'due_at', label: '신청 목표일을 입력해 주세요.', input_type: 'DATE', required: true, answer: null }],
  candidates: [],
  created_at: '2026-08-04T00:00:00Z',
  updated_at: '2026-08-04T00:00:01Z',
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
  window.sessionStorage.clear()
  vi.stubGlobal('fetch', vi.fn())
  vi.mocked(fetch).mockImplementation((input) => {
    const url = String(input)
    if (url.includes('/workflow-catalogs')) return Promise.resolve(jsonResponse(CATALOG))
    if (url.includes('/workers')) return Promise.resolve(jsonResponse(WORKER_PAGE))
    if (url.includes('/ai-runs')) return Promise.resolve(jsonResponse(AI_RUN, { status: 202 }))
    return Promise.resolve(jsonResponse({ task_id: 'T-new' }, { status: 201 }))
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/tasks/new']}>
      <Routes>
        <Route
          path="/tasks/new"
          element={
            <>
              <CreateWorkPage />
              <ToastViewport />
            </>
          }
        />
        <Route path="/tasks/:taskId" element={<p>업무 상세</p>} />
        <Route path="/tasks/new/review" element={<p>Agent 추가 질문</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CreateWorkPage', () => {
  it('disables the analyze button until a request is entered', async () => {
    const user = userEvent.setup()
    renderPage()

    const analyze = screen.getByRole('button', { name: '요청 분석하기 →' })
    expect(analyze).toBeDisabled()

    await user.type(screen.getByLabelText('업무 요청 내용'), '체류연장 서류 준비')
    expect(analyze).toBeEnabled()
  })

  it('fills the textarea when an example chip is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '체류연장 준비' }))

    expect(screen.getByLabelText('업무 요청 내용')).toHaveValue('체류연장 준비')
  })

  it('sends the exact natural-language request and opens the review page', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '체류연장 준비' }))
    await user.click(screen.getByRole('button', { name: '요청 분석하기 →' }))

    expect(await screen.findByText('Agent 추가 질문')).toBeInTheDocument()
    const analyzeCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url).endsWith('/ai-runs'))
    expect(analyzeCall).toBeDefined()
    expect(JSON.parse((analyzeCall![1] as RequestInit).body as string)).toEqual({
      instruction: '체류연장 준비',
    })
    expect(new Headers((analyzeCall![1] as RequestInit).headers).get('Idempotency-Key')).toBeTruthy()
  })

  it('switches the active input mode', async () => {
    const user = userEvent.setup()
    renderPage()

    const fileMode = screen.getByRole('button', { name: /파일 가져오기/ })
    await user.click(fileMode)

    expect(fileMode.className).toMatch(/modeCardActive/)
  })

  it('opens the file import wizard from 파일 가져오기 mode', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /파일 가져오기/ }))
    await user.click(screen.getByRole('button', { name: '파일 선택하기 →' }))

    expect(screen.getByRole('dialog', { name: '파일 가져오기 · 파일 확인' })).toBeInTheDocument()
  })

  it('shows a toast when a draft is saved', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '임시 저장' }))

    expect(screen.getByText('이 브라우저 탭에 초안을 저장했습니다.')).toBeInTheDocument()
    expect(JSON.parse(window.sessionStorage.getItem('fowoco:work-request-draft') ?? '{}')).toMatchObject({
      request: '',
      mode: 'nl',
    })
  })

  it('marks unsupported input modes as unavailable', () => {
    renderPage()

    expect(screen.getByRole('button', { name: /처리 절차/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /이전 업무/ })).toBeDisabled()
  })

  it('disables the direct-create button until worker/type/workflow/title are filled', async () => {
    const user = userEvent.setup()
    renderPage()

    const submit = screen.getByRole('button', { name: '업무 생성' })
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '근로자 선택' }))
    await user.click(await screen.findByRole('option', { name: '응웬반A' }))

    await user.click(screen.getByRole('button', { name: '업무 유형 선택' }))
    await user.click(screen.getByRole('option', { name: '체류기간 연장' }))

    await user.click(screen.getByRole('button', { name: 'Workflow 선택' }))
    await user.click(await screen.findByRole('option', { name: '체류기간 연장 처리' }))

    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText('제목'), '체류연장 준비')
    expect(submit).toBeEnabled()
  })

  it('creates the task and navigates to its detail page on submit', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '근로자 선택' }))
    await user.click(await screen.findByRole('option', { name: '응웬반A' }))
    await user.click(screen.getByRole('button', { name: '업무 유형 선택' }))
    await user.click(screen.getByRole('option', { name: '체류기간 연장' }))
    await user.click(screen.getByRole('button', { name: 'Workflow 선택' }))
    await user.click(await screen.findByRole('option', { name: '체류기간 연장 처리' }))
    await user.type(screen.getByLabelText('제목'), '체류연장 준비')

    await user.click(screen.getByRole('button', { name: '업무 생성' }))

    expect(await screen.findByText('업무 상세')).toBeInTheDocument()
    const createCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url).endsWith('/tasks'))
    expect(createCall).toBeDefined()
    const body = JSON.parse((createCall![1] as RequestInit).body as string)
    expect(body).toMatchObject({
      worker_id: 'W-1',
      task_type: 'STAY_PERIOD_EXTENSION',
      workflow_id: 'wf-stay-extension',
      title: '체류연장 준비',
    })
  })

  it('shows an error message when task creation fails', async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.includes('/workflow-catalogs')) return Promise.resolve(jsonResponse(CATALOG))
      if (url.includes('/workers')) return Promise.resolve(jsonResponse(WORKER_PAGE))
      return Promise.resolve(errorResponse(422, 'VALIDATION_FAILED', 'raw'))
    })
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '근로자 선택' }))
    await user.click(await screen.findByRole('option', { name: '응웬반A' }))
    await user.click(screen.getByRole('button', { name: '업무 유형 선택' }))
    await user.click(screen.getByRole('option', { name: '체류기간 연장' }))
    await user.click(screen.getByRole('button', { name: 'Workflow 선택' }))
    await user.click(await screen.findByRole('option', { name: '체류기간 연장 처리' }))
    await user.type(screen.getByLabelText('제목'), '체류연장 준비')

    await user.click(screen.getByRole('button', { name: '업무 생성' }))

    await waitFor(() => {
      expect(screen.getByText('입력값을 다시 확인해 주세요.')).toBeInTheDocument()
    })
  })
})
