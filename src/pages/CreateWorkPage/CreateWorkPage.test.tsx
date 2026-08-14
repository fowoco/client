import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { CreateWorkPage } from './CreateWorkPage'

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
  evidence: null,
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
  it('prefills the request forwarded from the dashboard as editable text', () => {
    renderPage({ pathname: '/tasks/new', state: { prefill: '응웬반A 체류기간 연장 준비' } })

    expect(screen.getByRole('textbox', { name: '원본 요청' })).toHaveValue(
      '응웬반A 체류기간 연장 준비',
    )
  })

  it('starts with an empty, editable request when nothing was forwarded', () => {
    renderPage()

    expect(screen.getByRole('textbox', { name: '원본 요청' })).toHaveValue('')
    expect(screen.getByRole('button', { name: '정보 보완' })).toBeDisabled()
  })

  it('navigates to the review flow with the text the user typed', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByRole('textbox', { name: '원본 요청' }), '직접 입력한 요청')
    await user.click(screen.getByRole('button', { name: '정보 보완' }))

    expect(await screen.findByText(/검토 화면\?aiRunId=A-1/)).toBeInTheDocument()
    const analyzeCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).endsWith('/ai-runs'))
    expect(JSON.parse((analyzeCall?.[1] as RequestInit).body as string)).toEqual({
      instruction: '직접 입력한 요청',
    })
  })

  it('renders the shared step indicator as a non-interactive progress display', () => {
    renderPage()

    expect(screen.getByText('1 요청 확인')).toBeInTheDocument()
    expect(screen.getByText('2 분석 결과')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /분석 결과/ })).not.toBeInTheDocument()
  })

  it('opens the file import wizard from the work item panel', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '파일로 근로자 명단 가져오기 →' }))

    expect(screen.getByRole('dialog', { name: '파일 가져오기 · 파일 확인' })).toBeInTheDocument()
  })
})
