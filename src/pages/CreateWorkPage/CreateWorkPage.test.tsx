import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { CreateWorkPage } from './CreateWorkPage'
import { DEFAULT_ORIGINAL_REQUEST, WORKFLOW_TASKS } from './createWorkData'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

const AI_RUN = {
  ai_run_id: 'A-1',
  request_id: 'R-1',
  instruction: '응웬반A 체류기간 연장 준비',
  status: 'SUCCEEDED',
  analysis_outcome: 'NEEDS_INFO',
  detected_intent: 'EXPIRY_RENEWAL',
  error_code: null,
  attempt_count: 1,
  version: 1,
  questions: [],
  candidates: [],
  created_at: '2026-08-08T00:00:00Z',
  updated_at: '2026-08-08T00:00:01Z',
}

function ReviewStub() {
  const location = useLocation()
  return <p>검토 화면{location.search}</p>
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
  window.sessionStorage.clear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(AI_RUN, { status: 202 })))
})

afterEach(() => {
  useToastStore.setState({ toasts: [] })
  vi.unstubAllGlobals()
})

function renderPage(initialEntry: string | { pathname: string; state?: unknown } = '/tasks/new') {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
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
        <Route path="/tasks/new/review" element={<ReviewStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CreateWorkPage', () => {
  it('shows the request forwarded from the dashboard as the original request', () => {
    renderPage({ pathname: '/tasks/new', state: { prefill: '응웬반A 체류기간 연장 준비' } })

    expect(screen.getByText('응웬반A 체류기간 연장 준비')).toBeInTheDocument()
  })

  it('falls back to a default original request when nothing was forwarded', () => {
    renderPage()

    expect(screen.getByText(DEFAULT_ORIGINAL_REQUEST.split('\n')[0])).toBeInTheDocument()
  })

  it('renders every candidate task in the work item', () => {
    renderPage()

    for (const task of WORKFLOW_TASKS) {
      expect(screen.getByText(task.title)).toBeInTheDocument()
    }
  })

  it('navigates to the review flow when moving to information review', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '정보 보완' }))

    expect(await screen.findByText(/검토 화면\?aiRunId=A-1/)).toBeInTheDocument()
    const analyzeCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url).endsWith('/ai-runs'))
    expect(JSON.parse((analyzeCall?.[1] as RequestInit).body as string)).toEqual({
      instruction: DEFAULT_ORIGINAL_REQUEST,
    })
  })

  it('jumps to a later review step when clicking it in the shared step indicator', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '3 초안 작성' }))

    expect(await screen.findByText('검토 화면?step=2')).toBeInTheDocument()
  })

  it('opens the file import wizard from the work item panel', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '파일로 근로자 명단 가져오기 →' }))

    expect(screen.getByRole('dialog', { name: '파일 가져오기 · 파일 확인' })).toBeInTheDocument()
  })

  it('shows a toast when editing the original request', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '원문 수정' }))

    expect(screen.getByText('원문 수정은 준비 중입니다.')).toBeInTheDocument()
  })
})
