import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TaskPageResponse, TaskSummaryResponse } from '../../api/tasks'
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

function task(
  taskId: string,
  overrides: Partial<TaskSummaryResponse> = {},
): TaskSummaryResponse {
  return {
    task_id: taskId,
    worker_id: 'W-1',
    case_id: null,
    task_type: 'STAY_PERIOD_EXTENSION',
    workflow_id: 'WF-1',
    workflow_catalog_version: '1',
    title: `업무 ${taskId}`,
    source: 'MANUAL',
    status: 'DRAFT',
    due_date: null,
    content_revision: 1,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

const TASKS = [
  task('T-1', {
    title: '응웬반A 체류연장 요청문',
    source: 'AI_CANDIDATE',
    status: 'READY_FOR_REVIEW',
    due_date: dateFromToday(1),
  }),
  task('T-2', {
    title: '계약 정보 보완',
    status: 'NEEDS_INFO',
    due_date: dateFromToday(5),
  }),
  task('T-3', {
    title: '외국인등록증 사본 제출',
    status: 'WAITING_WORKER',
    due_date: dateFromToday(0),
  }),
  task('T-4', {
    title: 'Agent 생성 체류연장 초안',
    source: 'AI_CANDIDATE',
    status: 'DRAFT',
    due_date: dateFromToday(10),
  }),
  task('T-5', {
    title: '완료된 업무',
    status: 'COMPLETED',
    due_date: dateFromToday(-1),
  }),
]

function taskPage(
  items: TaskSummaryResponse[],
  totalElements = items.length,
): TaskPageResponse {
  return {
    items,
    page: 0,
    size: 100,
    total_elements: totalElements,
    total_pages: totalElements > 100 ? 2 : 1,
  }
}

function TaskDetailProbe() {
  const { taskId } = useParams()
  return <p>업무 상세 {taskId}</p>
}

function WorkCreateProbe() {
  const location = useLocation()
  const prefill = (location.state as { prefill?: string } | null)?.prefill
  return <p>업무 생성 {prefill}</p>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks/new" element={<WorkCreateProbe />} />
        <Route path="/tasks" element={<p>업무함</p>} />
        <Route path="/tasks/:taskId" element={<TaskDetailProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(taskPage(TASKS))))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DashboardPage', () => {
  it('renders metrics and work rows from the Task API response', async () => {
    renderPage()

    expect(
      await screen.findByRole('heading', {
        name: '지금 확인이 필요한 승인 1건이 있습니다.',
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('1건 ›')).toHaveLength(4)
    expect(screen.getAllByText('응웬반A 체류연장 요청문').length).toBeGreaterThan(0)
    expect(screen.getAllByText('외국인등록증 사본 제출').length).toBeGreaterThan(0)
    expect(screen.queryByText('완료된 업무')).not.toBeInTheDocument()

    const requestedUrl = String(vi.mocked(fetch).mock.calls[0][0])
    expect(requestedUrl).toContain('/tasks?')
    expect(requestedUrl).toContain('size=100')
  })

  it('uses actual Task status groups in the Agent prepared panel', async () => {
    renderPage()

    expect(await screen.findByText('Agent 생성 초안 · 1건')).toBeInTheDocument()
    expect(screen.getByText('담당자 확인 필요 · 2건')).toBeInTheDocument()
    expect(screen.getByText('응답·기관 대기 · 1건')).toBeInTheDocument()
    expect(screen.getAllByText('Agent 생성 체류연장 초안').length).toBeGreaterThan(0)
  })

  it('opens the actual Task ID from the priority approval', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click((await screen.findAllByRole('button', { name: '승인 검토' }))[0])

    expect(await screen.findByText('업무 상세 T-1')).toBeInTheDocument()
  })

  it('shows the loading state while the Task API is pending', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    renderPage()

    expect(screen.getByText('업무 현황을 불러오는 중입니다')).toBeInTheDocument()
    expect(screen.queryByText(/지금 확인이 필요한 승인/)).not.toBeInTheDocument()
  })

  it('shows an honest empty state when no task exists', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(taskPage([])))
    renderPage()

    expect(await screen.findByText('등록된 업무가 없습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '업무 만들기' })).toBeInTheDocument()
  })

  it('shows an error state and retries the Task API request', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(jsonResponse(taskPage(TASKS)))
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '다시 시도' }))

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    expect((await screen.findAllByText('응웬반A 체류연장 요청문')).length).toBeGreaterThan(0)
  })

  it('renders a safe cap notice when the API has more than 100 tasks', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(taskPage(TASKS, 101)))
    renderPage()

    expect(await screen.findByText(/최근 100건 기준입니다/)).toBeInTheDocument()
  })

  it('fills the input from a prompt chip and forwards it on submit', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: AI_REQUEST_PROMPT_CHIPS[0] }))
    const requestInput = screen.getByRole('textbox', { name: 'Agent 업무 요청' })
    expect(requestInput).toHaveValue(AI_REQUEST_PROMPT_CHIPS[0])

    await user.click(screen.getByRole('button', { name: '업무 요청 계속하기' }))

    expect(await screen.findByText(`업무 생성 ${AI_REQUEST_PROMPT_CHIPS[0]}`)).toBeInTheDocument()
  })

  it('accepts a natural-language request directly and submits it with Enter', async () => {
    const user = userEvent.setup()
    renderPage()

    const requestInput = screen.getByRole('textbox', { name: 'Agent 업무 요청' })
    await user.type(requestInput, '응웬반A 체류기간 연장 준비{Enter}')

    expect(await screen.findByText('업무 생성 응웬반A 체류기간 연장 준비')).toBeInTheDocument()
  })
})
