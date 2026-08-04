import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardPage } from './DashboardPage'
import { AI_REQUEST_PROMPT_CHIPS } from './dashboardData'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function dateFromToday(offset: number) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function task(overrides: Record<string, unknown>) {
  return {
    task_id: 'T-1',
    worker_id: 'W-1',
    case_id: null,
    task_type: 'STAY_PERIOD_EXTENSION',
    workflow_id: 'WF-1',
    workflow_catalog_version: '1',
    title: '응웬반A 체류연장 준비',
    source: 'AI_CANDIDATE',
    status: 'READY_FOR_REVIEW',
    due_date: dateFromToday(1),
    content_revision: 1,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

const TASK_PAGE = {
  items: [
    task({}),
    task({ task_id: 'T-2', title: '계약 정보 보완', status: 'NEEDS_INFO', due_date: dateFromToday(5) }),
    task({ task_id: 'T-3', title: '완료된 서류 확인', status: 'COMPLETED', due_date: dateFromToday(0) }),
  ],
  page: 0,
  size: 100,
  total_elements: 3,
  total_pages: 1,
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(TASK_PAGE)))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks/new" element={<p>업무 생성 페이지</p>} />
        <Route path="/tasks/:taskId" element={<p>업무 상세 페이지</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  it('renders actual task metrics and open work items', async () => {
    renderPage()

    expect(await screen.findByText('검토 필요')).toBeInTheDocument()
    expect(screen.getAllByText('1건 ›')).toHaveLength(2)
    expect(screen.getAllByText('2건 ›')).toHaveLength(2)
    expect(screen.getByText('응웬반A 체류연장 준비')).toBeInTheDocument()
    expect(screen.getByText('계약 정보 보완')).toBeInTheDocument()
    expect(screen.queryByText('완료된 서류 확인')).not.toBeInTheDocument()
  })

  it('does not present a static approval queue as server data', async () => {
    renderPage()

    expect(await screen.findByText(/승인 대기 수치는 승인 API 연결 전까지 표시하지 않습니다/)).toBeInTheDocument()
    expect(screen.queryByText('내 승인 대기')).not.toBeInTheDocument()
  })

  it('shows the loading state while the Task API is pending', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    renderPage()

    expect(screen.getByText('업무 현황을 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an honest empty state when no task exists', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ...TASK_PAGE, items: [], total_elements: 0 }))
    renderPage()

    expect(await screen.findByText('등록된 업무가 없습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '업무 만들기' })).toBeInTheDocument()
  })

  it('shows an error state and retries the actual request', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(jsonResponse(TASK_PAGE))
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '다시 시도' }))

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('응웬반A 체류연장 준비')).toBeInTheDocument()
  })

  it('navigates to work creation with the chosen prompt chip prefilled', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: AI_REQUEST_PROMPT_CHIPS[0] }))

    expect(await screen.findByText('업무 생성 페이지')).toBeInTheDocument()
  })

  it('opens the actual task id from a work row', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /응웬반A 체류연장 준비/ }))

    expect(await screen.findByText('업무 상세 페이지')).toBeInTheDocument()
  })
})
