import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TaskPageResponse, TaskSummaryResponse } from '../../api/tasks'
import { WorkListPage } from './WorkListPage'

function isoDateOffset(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function task(overrides: Partial<TaskSummaryResponse>): TaskSummaryResponse {
  return {
    task_id: 'T-1',
    worker_id: 'W-1',
    case_id: null,
    task_type: 'STAY_PERIOD_EXTENSION',
    workflow_id: 'wf-stay-extension',
    workflow_catalog_version: '1',
    title: '체류연장 준비',
    source: 'MANUAL',
    status: 'READY_FOR_REVIEW',
    due_date: isoDateOffset(12),
    content_revision: 1,
    version: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const TASKS: TaskSummaryResponse[] = [
  task({ task_id: 'T-1', title: '응웬반A 체류연장 준비', due_date: isoDateOffset(5), status: 'READY_FOR_REVIEW' }),
  task({ task_id: 'T-2', title: '외국인등록증 사본 제출 요청', due_date: isoDateOffset(0), status: 'WAITING_WORKER' }),
  task({ task_id: 'T-3', title: '7월 외부기관 제출자료 취합', due_date: isoDateOffset(2), status: 'WAITING_EXTERNAL' }),
  task({ task_id: 'T-4', title: '신규 입사자 교육 일정 확정', due_date: isoDateOffset(4), status: 'DRAFT' }),
  task({ task_id: 'T-5', title: '월간 기숙사 점검 결과 정리', due_date: isoDateOffset(7), status: 'DRAFT' }),
  task({ task_id: 'T-6', title: '쩐티B 표준근로계약서 갱신', due_date: isoDateOffset(25), status: 'APPROVED' }),
]

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init })
}

function errorResponse(status: number, code: string, message: string) {
  return jsonResponse(
    { timestamp: '2026-07-27T01:23:45Z', status, code, message, path: '/api/v1/tasks', request_id: 'req-1', field_errors: [] },
    { status },
  )
}

function taskPageResponse(items: TaskSummaryResponse[]): TaskPageResponse {
  return { items, page: 0, size: 100, total_elements: items.length, total_pages: 1 }
}

function catalogResponse() {
  return { bundle_id: 'b-1', bundle_version: '1', bundle_status: 'ACTIVE', source_repository: 'fowoco/knowledge', generated_at: '2026-07-01T00:00:00Z', workflows: [] }
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/tasks']}>
      <Routes>
        <Route path="/tasks" element={<WorkListPage />} />
        <Route path="/tasks/:caseId" element={<p>업무 상세</p>} />
        <Route path="/tasks/new" element={<p>업무 생성</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function mockTasksAndCatalog() {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = String(input)
    if (url.includes('/workflow-catalogs')) return Promise.resolve(jsonResponse(catalogResponse()))
    return Promise.resolve(jsonResponse(taskPageResponse(TASKS)))
  })
}

describe('WorkListPage', () => {
  it('renders the top 5 priority tasks sorted by due date', async () => {
    mockTasksAndCatalog()
    renderPage()

    expect(await screen.findByText('응웬반A 체류연장 준비')).toBeInTheDocument()
    expect(screen.queryByText('쩐티B 표준근로계약서 갱신')).not.toBeInTheDocument()
  })

  it('shows every task after clicking "전체 업무 보기"', async () => {
    mockTasksAndCatalog()
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '전체 업무 보기 →' }))

    expect(screen.getByText('쩐티B 표준근로계약서 갱신')).toBeInTheDocument()
  })

  it('sends the search query to the server as a keyword param', async () => {
    mockTasksAndCatalog()
    const user = userEvent.setup()
    renderPage()

    await screen.findByLabelText('업무 검색')
    await user.type(screen.getByLabelText('업무 검색'), '외국인등록증')

    await waitFor(() => {
      const calledUrls = vi.mocked(fetch).mock.calls.map(([url]) => String(url))
      expect(calledUrls.some((url) => url.includes('keyword='))).toBe(true)
    })
  })

  it('shows an empty state when a search has no matches', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.includes('/workflow-catalogs')) return Promise.resolve(jsonResponse(catalogResponse()))
      return Promise.resolve(jsonResponse(taskPageResponse([])))
    })
    renderPage()

    await user.type(screen.getByLabelText('업무 검색'), '존재하지않는검색어')

    expect(await screen.findByText('등록된 업무가 없습니다')).toBeInTheDocument()
  })

  it('shows only READY_FOR_REVIEW tasks on the "검토 필요" tab', async () => {
    mockTasksAndCatalog()
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('응웬반A 체류연장 준비')
    await user.click(screen.getByRole('tab', { name: /검토 필요/ }))

    expect(screen.getByText('응웬반A 체류연장 준비')).toBeInTheDocument()
    expect(screen.queryByText('쩐티B 표준근로계약서 갱신')).not.toBeInTheDocument()
  })

  it('shows WAITING_WORKER/WAITING_EXTERNAL tasks on the "후속조치" tab', async () => {
    mockTasksAndCatalog()
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('응웬반A 체류연장 준비')
    await user.click(screen.getByRole('tab', { name: /후속조치/ }))

    expect(screen.getByText('외국인등록증 사본 제출 요청')).toBeInTheDocument()
    expect(screen.getByText('7월 외부기관 제출자료 취합')).toBeInTheDocument()
    expect(screen.queryByText('응웬반A 체류연장 준비')).not.toBeInTheDocument()
  })

  it('filters by the status dropdown', async () => {
    mockTasksAndCatalog()
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('응웬반A 체류연장 준비')
    const trigger = screen.getByRole('button', { name: '상태 필터' })
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: '상태 · 검토 필요' }))

    expect(screen.getByText('응웬반A 체류연장 준비')).toBeInTheDocument()
    expect(screen.queryByText('외국인등록증 사본 제출 요청')).not.toBeInTheDocument()
  })

  it('navigates to the task detail page when a row is clicked', async () => {
    mockTasksAndCatalog()
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByText('응웬반A 체류연장 준비'))

    expect(await screen.findByText('업무 상세')).toBeInTheDocument()
  })

  it('shows a loading state', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('업무 목록을 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an error state with a retry action', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(500, 'INTERNAL_SERVER_ERROR', 'raw'))
    renderPage()

    expect(await screen.findByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })

  it('shows an empty state with a create action when there are no tasks', async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.includes('/workflow-catalogs')) return Promise.resolve(jsonResponse(catalogResponse()))
      return Promise.resolve(jsonResponse(taskPageResponse([])))
    })
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('등록된 업무가 없습니다')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '업무 만들기' }))
    expect(await screen.findByText('업무 생성')).toBeInTheDocument()
  })

  it('shows a cap notice when the server has more tasks than the fetched page', async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.includes('/workflow-catalogs')) return Promise.resolve(jsonResponse(catalogResponse()))
      return Promise.resolve(jsonResponse({ items: TASKS, page: 0, size: 100, total_elements: 150, total_pages: 2 }))
    })
    renderPage()

    expect(await screen.findByText(/전체 150개 중 6개만 불러왔습니다/)).toBeInTheDocument()
  })

  it('shows the metric strip counts computed from task status and due date', async () => {
    mockTasksAndCatalog()
    renderPage()

    expect(await screen.findByText('1건 ›')).toBeInTheDocument() // 승인 대기
    expect(screen.getByText('2건 ›')).toBeInTheDocument() // AI 준비 완료
    expect(screen.getByText('5건 ›')).toBeInTheDocument() // 긴급 업무
    expect(screen.getByText('0건 ›')).toBeInTheDocument() // 오늘 완료
  })

  it('filters to DRAFT tasks when the "AI 준비 완료" metric card is clicked', async () => {
    mockTasksAndCatalog()
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'AI 준비 완료 2건 ›' }))

    expect(screen.getByText('신규 입사자 교육 일정 확정')).toBeInTheDocument()
    expect(screen.getByText('월간 기숙사 점검 결과 정리')).toBeInTheDocument()
    expect(screen.queryByText('응웬반A 체류연장 준비')).not.toBeInTheDocument()
  })
})
