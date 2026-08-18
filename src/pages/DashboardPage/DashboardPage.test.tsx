import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardTodayResponse } from '../../api/dashboard'
import type { AiRunResponse } from '../../api/aiRuns'
import { DashboardTodayProvider } from '../../components/layout/DashboardTodayProvider'
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

function WorkReviewProbe() {
  const location = useLocation()
  const state = location.state as { draft?: { request?: string } } | null
  return <p>{`업무 검토 ${state?.draft?.request ?? ''}${location.search}`}</p>
}

function WorkListProbe() {
  const location = useLocation()
  return <p>{`업무함 ${location.search}`}</p>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <DashboardTodayProvider>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks/new/review" element={<WorkReviewProbe />} />
          <Route path="/tasks" element={<WorkListProbe />} />
          <Route path="/tasks/:taskId" element={<TaskDetailProbe />} />
          <Route path="/workers/:workerId/detail" element={<WorkerDetailProbe />} />
        </Routes>
      </DashboardTodayProvider>
    </MemoryRouter>,
  )
}

const AI_RUN_RESPONSE: AiRunResponse = {
  ai_run_id: 'AI-RUN-1',
  request_id: 'REQUEST-1',
  instruction: '응웬반A 체류기간 연장 준비',
  status: 'SUCCEEDED',
  analysis_outcome: 'CONTEXT_REQUIRED',
  detected_intent: 'EXPIRY_RENEWAL',
  evidence: null,
  error_code: null,
  attempt_count: 1,
  version: 1,
  questions: [],
  candidates: [],
  created_at: '2026-08-18T00:00:00Z',
  updated_at: '2026-08-18T00:00:00Z',
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.includes('/workers')) {
        return Promise.resolve(jsonResponse({ items: [], page: 0, size: 100, total_elements: 0 }))
      }
      if (url.includes('/ai-runs')) {
        return Promise.resolve(jsonResponse(AI_RUN_RESPONSE))
      }
      return Promise.resolve(jsonResponse(TODAY_RESPONSE))
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DashboardPage', () => {
  it('renders the Server Today projection without calculating from the Task list', async () => {
    renderPage()

    expect(
      await screen.findByRole('heading', {
        name: '오늘의 업무를 확인하세요.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '승인 대기 2건 업무함에서 보기' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '오늘 마감 1건 업무함에서 보기' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '정보 보완 1건 업무함에서 보기' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '응답 대기 3건 업무함에서 보기' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('응웬반A 체류연장 요청문').length).toBeGreaterThan(0)
    expect(screen.getAllByText('응웬반A').length).toBeGreaterThan(0)
    expect(screen.getByText(/처리 기한 .*D-1/)).toBeInTheDocument()
    expect(screen.getAllByText('담당자').length).toBeGreaterThan(0)
    expect(screen.getByText('체류기간 만료')).toBeInTheDocument()
    expect(screen.getByText('여권 사본 만료')).toBeInTheDocument()

    const todayCall = vi
      .mocked(fetch)
      .mock.calls.find(([input]) => String(input).includes('/dashboard/today'))
    expect(String(todayCall?.[0])).toContain('/dashboard/today?timezone=Asia%2FSeoul')
    expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).includes('/tasks?'))).toBe(
      false,
    )
  })

  it('renders the recommendation groups returned by the Today API', async () => {
    renderPage()

    expect(await screen.findByText('Agent 생성 초안 · 1건')).toBeInTheDocument()
    expect(screen.getByText('담당자 확인 필요 · 1건')).toBeInTheDocument()
    expect(screen.getByText('응답·기관 대기 · 1건')).toBeInTheDocument()
    expect(screen.getByText('연결된 업무 4건')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Agent 작업 공간' })).toBeInTheDocument()
    expect(screen.getAllByText('Agent 생성 체류연장 초안').length).toBeGreaterThan(0)
  })

  it('keeps the dashboard hierarchy focused on the three main work regions', async () => {
    renderPage()

    expect(
      await screen.findByRole('region', { name: 'Agent에게 새 업무 요청' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '담당자 우선 업무' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Agent 작업 공간' })).toBeInTheDocument()
    expect(screen.queryByText('현재 화면 정보')).not.toBeInTheDocument()
    expect(screen.queryByText('7일 기한')).not.toBeInTheDocument()
  })

  it('keeps the dashboard concise and links to the full work lists', async () => {
    const previewResponse: DashboardTodayResponse = {
      ...TODAY_RESPONSE,
      priority_tasks: Array.from({ length: 5 }, (_, index) => ({
        ...TODAY_RESPONSE.priority_tasks[0],
        task_id: `T-PREVIEW-${index + 1}`,
        worker_id: `W-PREVIEW-${index + 1}`,
        title: `우선 업무 ${index + 1}`,
      })),
      upcoming_7_days: Array.from({ length: 6 }, (_, index) => ({
        ...TODAY_RESPONSE.upcoming_7_days[0],
        worker_id: `W-EXPIRY-${index + 1}`,
        display_name: `만료 근로자 ${index + 1}`,
      })),
    }
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.includes('/workers')) {
        return Promise.resolve(jsonResponse({ items: [], page: 0, size: 100, total_elements: 0 }))
      }
      return Promise.resolve(jsonResponse(previewResponse))
    })

    renderPage()

    expect(await screen.findByRole('button', { name: '전체 업무 보기' })).toBeInTheDocument()
    expect(screen.getByText('우선 업무 4')).toBeInTheDocument()
    expect(screen.queryByText('우선 업무 5')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '전체 6건 보기' })).toBeInTheDocument()
    expect(screen.getByText('만료 근로자 4')).toBeInTheDocument()
    expect(screen.queryByText('만료 근로자 5')).not.toBeInTheDocument()
  })

  it('opens the actual Task ID from priority and recommendation items', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click((await screen.findAllByRole('button', { name: '승인 검토' }))[0])
    expect(await screen.findByText('업무 상세 T-1')).toBeInTheDocument()
  })

  it('opens the work inbox with the selected dashboard condition', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '정보 보완 1건 업무함에서 보기' }))

    expect(await screen.findByText('업무함 ?focus=needs-info')).toBeInTheDocument()
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
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.includes('/workers')) {
        return Promise.resolve(jsonResponse({ items: [], page: 0, size: 100, total_elements: 0 }))
      }
      return Promise.resolve(jsonResponse(EMPTY_RESPONSE))
    })
    renderPage()

    expect(await screen.findByText('등록된 업무가 없습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '업무 만들기' })).toBeInTheDocument()
  })

  it('shows an error state and retries the Today API request', async () => {
    let todayCallCount = 0
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.includes('/workers')) {
        return Promise.resolve(jsonResponse({ items: [], page: 0, size: 100, total_elements: 0 }))
      }
      todayCallCount += 1
      if (todayCallCount === 1) return Promise.reject(new TypeError('network'))
      return Promise.resolve(jsonResponse(TODAY_RESPONSE))
    })
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '다시 시도' }))

    await waitFor(() => expect(todayCallCount).toBe(2))
    expect((await screen.findAllByText('응웬반A 체류연장 요청문')).length).toBeGreaterThan(0)
  })

  it('fills the input from a prompt chip and starts analysis with one submit', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: AI_REQUEST_PROMPT_CHIPS[0] }))
    const requestInput = screen.getByRole('textbox', { name: '업무 내용' })
    expect(requestInput).toHaveValue(AI_REQUEST_PROMPT_CHIPS[0])
    expect(requestInput).toHaveFocus()

    await user.click(screen.getByRole('button', { name: '업무 분석' }))

    expect(
      await screen.findByText(`업무 검토 ${AI_REQUEST_PROMPT_CHIPS[0]}?aiRunId=AI-RUN-1`),
    ).toBeInTheDocument()
    const aiRunCall = vi
      .mocked(fetch)
      .mock.calls.find(([input]) => String(input).includes('/ai-runs'))
    expect(aiRunCall?.[1]).toMatchObject({ method: 'POST' })
    expect(aiRunCall?.[1]?.body).toBe(JSON.stringify({ instruction: AI_REQUEST_PROMPT_CHIPS[0] }))
  })

  it('accepts a natural-language request directly and submits it with Enter', async () => {
    const user = userEvent.setup()
    renderPage()

    const requestInput = await screen.findByRole('textbox', { name: '업무 내용' })
    await user.type(requestInput, '응웬반A 체류기간 연장 준비{Enter}')

    expect(
      await screen.findByText('업무 검토 응웬반A 체류기간 연장 준비?aiRunId=AI-RUN-1'),
    ).toBeInTheDocument()
  })

  it('shows an API error without leaving the dashboard', async () => {
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.includes('/workers')) {
        return Promise.resolve(jsonResponse({ items: [], page: 0, size: 100, total_elements: 0 }))
      }
      if (url.includes('/ai-runs')) {
        return Promise.resolve(
          jsonResponse(
            { code: 'AI_UNAVAILABLE', message: 'AI 분석 서비스를 사용할 수 없습니다.' },
            { status: 503 },
          ),
        )
      }
      return Promise.resolve(jsonResponse(TODAY_RESPONSE))
    })
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByRole('textbox', { name: '업무 내용' }), '체류연장 준비')
    await user.click(screen.getByRole('button', { name: '업무 분석' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'AI 분석 서비스를 사용할 수 없습니다.',
    )
    expect(screen.getByRole('heading', { name: '오늘의 업무를 확인하세요.' })).toBeInTheDocument()
  })
})
