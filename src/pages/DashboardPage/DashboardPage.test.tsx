import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardTodayResponse } from '../../api/dashboard'
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

const TODAY_RESPONSE: DashboardTodayResponse = {
  summary_counts: {
    pending_approval: 2,
    due_today: 1,
    needs_info: 1,
    worker_response: 3,
  },
  priority_tasks: [
    {
      task_id: 'T-1',
      worker_id: 'W-1',
      title: '응웬반A 체류연장 요청문',
      status: 'READY_FOR_REVIEW',
      due_date: dateFromToday(1),
    },
    {
      task_id: 'T-2',
      worker_id: 'W-2',
      title: '계약 정보 보완',
      status: 'NEEDS_INFO',
      due_date: dateFromToday(5),
    },
  ],
  upcoming_7_days: [
    {
      worker_id: 'W-1',
      display_name: '응웬반A',
      category: 'STAY_EXPIRY',
      expiry_date: dateFromToday(3),
      document_type: null,
    },
    {
      worker_id: 'W-2',
      display_name: '아디 수르야',
      category: 'DOCUMENT_EXPIRY',
      expiry_date: dateFromToday(6),
      document_type: 'PASSPORT_COPY',
    },
  ],
  recommendations: {
    connected_count: 4,
    prepared: [{ task_id: 'T-3', title: 'Agent 생성 체류연장 초안', status: 'DRAFT' }],
    review: [{ task_id: 'T-2', title: '계약 정보 보완', status: 'NEEDS_INFO' }],
    after_approval: [{ task_id: 'T-4', title: '외국인등록증 사본 제출', status: 'WAITING_WORKER' }],
  },
  approval_count: 2,
  worker_response_count: 3,
}

const EMPTY_RESPONSE: DashboardTodayResponse = {
  summary_counts: {
    pending_approval: 0,
    due_today: 0,
    needs_info: 0,
    worker_response: 0,
  },
  priority_tasks: [],
  upcoming_7_days: [],
  recommendations: {
    connected_count: 0,
    prepared: [],
    review: [],
    after_approval: [],
  },
  approval_count: 0,
  worker_response_count: 0,
}

function TaskDetailProbe() {
  const { taskId } = useParams()
  return <p>업무 상세 {taskId}</p>
}

function WorkerDetailProbe() {
  const { workerId } = useParams()
  return <p>근로자 상세 {workerId}</p>
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
        <Route path="/workers/:workerId/detail" element={<WorkerDetailProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(TODAY_RESPONSE)))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DashboardPage', () => {
  it('renders the Server Today projection without calculating from the Task list', async () => {
    renderPage()

    expect(
      await screen.findByRole('heading', {
        name: '지금 확인이 필요한 승인 2건이 있습니다.',
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('2건 ›')).toHaveLength(1)
    expect(screen.getAllByText('1건 ›')).toHaveLength(2)
    expect(screen.getAllByText('3건 ›')).toHaveLength(1)
    expect(screen.getAllByText('응웬반A 체류연장 요청문').length).toBeGreaterThan(0)
    expect(screen.getByText('응웬반A')).toBeInTheDocument()
    expect(screen.getByText('체류기간 만료')).toBeInTheDocument()
    expect(screen.getByText('여권 사본 만료')).toBeInTheDocument()

    const requestedUrl = String(vi.mocked(fetch).mock.calls[0][0])
    expect(requestedUrl).toContain('/dashboard/today?timezone=Asia%2FSeoul')
    expect(requestedUrl).not.toContain('/tasks?')
  })

  it('renders the recommendation groups returned by the Today API', async () => {
    renderPage()

    expect(await screen.findByText('Agent 생성 초안 · 1건')).toBeInTheDocument()
    expect(screen.getByText('담당자 확인 필요 · 1건')).toBeInTheDocument()
    expect(screen.getByText('응답·기관 대기 · 1건')).toBeInTheDocument()
    expect(screen.getByText('연결된 업무 4건 · 담당자 확인 필요 1건')).toBeInTheDocument()
    expect(screen.getAllByText('Agent 생성 체류연장 초안').length).toBeGreaterThan(0)
  })

  it('opens the actual Task ID from priority and recommendation items', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click((await screen.findAllByRole('button', { name: '승인 검토' }))[0])
    expect(await screen.findByText('업무 상세 T-1')).toBeInTheDocument()
  })

  it('opens the worker detail from an upcoming expiry item', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /응웬반A.*체류기간 만료/ }))
    expect(await screen.findByText('근로자 상세 W-1')).toBeInTheDocument()
  })

  it('shows the loading state while the Today API is pending', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    renderPage()

    expect(screen.getByText('업무 현황을 불러오는 중입니다')).toBeInTheDocument()
    expect(screen.queryByText(/지금 확인이 필요한 승인/)).not.toBeInTheDocument()
  })

  it('shows an honest empty state when the Today projection is empty', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(EMPTY_RESPONSE))
    renderPage()

    expect(await screen.findByText('등록된 업무가 없습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '업무 만들기' })).toBeInTheDocument()
  })

  it('shows an error state and retries the Today API request', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(jsonResponse(TODAY_RESPONSE))
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '다시 시도' }))

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    expect((await screen.findAllByText('응웬반A 체류연장 요청문')).length).toBeGreaterThan(0)
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
