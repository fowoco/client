import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CasePageResponse, CaseSummaryResponse, CaseTaskResponse } from '../../api/cases'
import type { WorkerPageResponse, WorkerResponse } from '../../api/workers'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { WorkListPage } from './WorkListPage'

function isoDateOffset(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function worker(
  workerId: string,
  displayName: string,
  overrides: Partial<WorkerResponse> = {},
): WorkerResponse {
  return {
    worker_id: workerId,
    company_id: 'C-1',
    display_name: displayName,
    nationality_code: 'VN',
    preferred_language: 'vi',
    work_status: 'ACTIVE',
    visa_type: null,
    stay_expiry_date: null,
    contract_start_date: null,
    contract_end_date: null,
    employment_permit_end_date: null,
    employment_activity_end_date: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    version: 1,
    ...overrides,
  }
}

function currentTask(overrides: Partial<CaseTaskResponse> & { task_id: string }): CaseTaskResponse {
  return {
    task_type: 'STAY_PERIOD_EXTENSION',
    title: `업무 ${overrides.task_id}`,
    status: 'DRAFT',
    due_date: null,
    ...overrides,
  }
}

function caseSummary(
  caseId: string,
  workerId: string,
  workerDisplayName: string,
  overrides: Partial<CaseSummaryResponse> = {},
): CaseSummaryResponse {
  return {
    case_id: caseId,
    worker_id: workerId,
    worker_display_name: workerDisplayName,
    title: `Case ${caseId}`,
    display_status: 'REVIEW_REQUIRED',
    has_unread_response: false,
    priority: 'NORMAL',
    progress: { completed_steps: 0, total_steps: 1, percentage: 0 },
    due_date: null,
    current_task: null,
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const WORKERS = [
  worker('W-1', '응우옌 안'),
  worker('W-2', '파티마 누르', { nationality_code: 'ID' }),
]

const CASES = [
  caseSummary('CASE-1', 'W-1', '응우옌 안', {
    title: '체류기간 연장',
    display_status: 'REVIEW_REQUIRED',
    priority: 'HIGH',
    progress: { completed_steps: 1, total_steps: 2, percentage: 50 },
    due_date: isoDateOffset(5),
    current_task: currentTask({
      task_id: 'T-1',
      title: '체류연장 업무 초안',
      status: 'READY_FOR_REVIEW',
      due_date: isoDateOffset(5),
    }),
  }),
  caseSummary('CASE-2', 'W-2', '파티마 누르', {
    title: '표준근로계약서 갱신',
    display_status: 'DOCUMENT_PENDING',
    priority: 'NORMAL',
    progress: { completed_steps: 0, total_steps: 1, percentage: 0 },
    due_date: isoDateOffset(1),
    current_task: currentTask({
      task_id: 'T-3',
      task_type: 'RECONTRACT',
      title: '표준근로계약서 갱신',
      status: 'DRAFT',
      due_date: isoDateOffset(1),
    }),
  }),
]

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function errorResponse(path: string) {
  return jsonResponse(
    {
      timestamp: '2026-07-31T00:00:00Z',
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'raw',
      path,
      request_id: 'req-1',
      field_errors: [],
    },
    { status: 500 },
  )
}

function workerPageResponse(
  items: WorkerResponse[],
  totalElements = items.length,
): WorkerPageResponse {
  return {
    items,
    page: 0,
    size: 100,
    total_elements: totalElements,
  }
}

function casePageResponse(items: CaseSummaryResponse[], totalElements = items.length): CasePageResponse {
  return {
    items,
    page: 0,
    size: 100,
    total_elements: totalElements,
    total_pages: totalElements > 100 ? 2 : 1,
  }
}

interface MockApiOptions {
  workers?: WorkerPageResponse | Response
  cases?: CasePageResponse | Response
}

function mockApi(options: MockApiOptions = {}) {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = String(input)
    if (url.includes('/workers')) {
      const value = options.workers ?? workerPageResponse(WORKERS)
      return Promise.resolve(value instanceof Response ? value : jsonResponse(value))
    }
    const value = options.cases ?? casePageResponse(CASES)
    return Promise.resolve(value instanceof Response ? value : jsonResponse(value))
  })
}

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>
}

function TaskDetailProbe() {
  const { taskId } = useParams()
  return <p>업무 상세 {taskId}</p>
}

function WorkCreateProbe() {
  const location = useLocation()
  const state = location.state as { workerId?: string; prefill?: string } | null
  return <p>{`업무 생성 ${state?.workerId ?? ''} ${state?.prefill ?? ''}`}</p>
}

function renderPage(initialEntry = '/tasks', { withToasts = false } = {}) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/tasks"
          element={
            <>
              <WorkListPage />
              <LocationProbe />
              {withToasts && <ToastViewport />}
            </>
          }
        />
        <Route path="/tasks/:taskId" element={<TaskDetailProbe />} />
        <Route path="/tasks/new" element={<WorkCreateProbe />} />
        <Route path="/tasks/new/review" element={<p>업무 검토 화면</p>} />
        <Route path="/workers" element={<p>근로자 등록 화면</p>} />
        <Route path="/workers/:workerId/detail" element={<p>근로자 상세 화면</p>} />
        <Route path="/documents" element={<p>문서함 화면</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  useToastStore.setState({ toasts: [] })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('WorkListPage', () => {
  it('joins case and worker data into a selected master-detail view', async () => {
    mockApi()
    renderPage()

    expect(await screen.findByRole('heading', { name: '응우옌 안', level: 2 })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '체류연장 업무 초안', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', { name: /체류기간 연장 Case 진행률/ }),
    ).toHaveAttribute('value', '1')

    const calledUrls = vi.mocked(fetch).mock.calls.map(([url]) => String(url))
    expect(calledUrls).toHaveLength(2)
    expect(calledUrls.some((url) => url.includes('/workers?'))).toBe(true)
    expect(calledUrls.some((url) => url.includes('/cases?'))).toBe(true)
    expect(calledUrls.some((url) => /\/tasks\/T-/.test(url))).toBe(false)
  })

  it('updates the detail and URL when another worker is selected', async () => {
    mockApi()
    const user = userEvent.setup()
    renderPage()

    const option = await screen.findByRole('option', { name: /파티마 누르/ })
    await user.click(option)

    expect(screen.getByRole('heading', { name: '파티마 누르', level: 2 })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/tasks?workerId=W-2')
    expect(option).toHaveAttribute('aria-selected', 'true')
  })

  it('restores a selected worker from the query string', async () => {
    mockApi()
    renderPage('/tasks?workerId=W-2')

    expect(
      await screen.findByRole('heading', { name: '파티마 누르', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /파티마 누르/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('searches worker and case fields in the loaded data without re-fetching', async () => {
    mockApi()
    const user = userEvent.setup()
    renderPage()

    const search = await screen.findByLabelText('근로자·업무 건·지금 할 일 검색')
    await user.type(search, '표준근로계약서')

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /파티마 누르/ })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: /응우옌 안/ })).not.toBeInTheDocument()
    })

    const caseUrls = vi
      .mocked(fetch)
      .mock.calls.map(([url]) => String(url))
      .filter((url) => url.includes('/cases?'))
    expect(caseUrls).toHaveLength(1)
    expect(caseUrls[0]).not.toContain('keyword=')
  })

  it('sorts workers by due date when requested', async () => {
    mockApi()
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('option', { name: /응우옌 안/ })
    await user.click(screen.getByRole('button', { name: '업무함 정렬' }))
    await user.click(screen.getByRole('option', { name: '정렬 · 마감 임박순' }))

    const targetList = screen.getByRole('listbox', { name: '업무 대상 근로자' })
    expect(within(targetList).getAllByRole('option')[0]).toHaveAccessibleName(/파티마 누르/)
  })

  it('opens the existing Task detail route with task_id, not case_id', async () => {
    mockApi()
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '업무 건 열기' }))

    expect(await screen.findByText('업무 상세 T-1')).toBeInTheDocument()
    expect(screen.queryByText('업무 상세 CASE-1')).not.toBeInTheDocument()
  })

  it('keeps workers visible and marks the work connection as unavailable when the Case API fails', async () => {
    mockApi({ cases: errorResponse('/api/v1/cases') })
    renderPage()

    expect(
      await screen.findByText('근로자 목록은 표시했지만 업무 정보를 갱신하지 못했습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: '업무 대상 근로자' })).toBeInTheDocument()
    expect(screen.getByText('업무 정보를 확인하지 못했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새 업무 요청' })).toBeDisabled()
  })

  it('shows a blocking error when neither workers nor cases can be loaded', async () => {
    mockApi({
      cases: errorResponse('/api/v1/cases'),
      workers: errorResponse('/api/v1/workers'),
    })
    renderPage()

    expect(await screen.findByText('업무함 정보를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByRole('listbox', { name: '업무 대상 근로자' })).not.toBeInTheDocument()
  })

  it('shows a blocking error when cases are empty and workers cannot be loaded', async () => {
    mockApi({ cases: casePageResponse([]), workers: errorResponse('/api/v1/workers') })
    renderPage()

    expect(await screen.findByText('업무함 정보를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByRole('listbox', { name: '업무 대상 근로자' })).not.toBeInTheDocument()
  })

  it('still shows the case list when the Worker API fails, with a fallback meta line', async () => {
    mockApi({ workers: errorResponse('/api/v1/workers') })
    renderPage()

    expect(await screen.findByRole('heading', { name: '응우옌 안', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('근무 정보 확인 필요')).toBeInTheDocument()
  })

  it('shows registered workers on the left and a no-work detail when there are no cases', async () => {
    mockApi({ cases: casePageResponse([]) })
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByRole('option', { name: /응우옌 안.*업무 없음/ })).toBeInTheDocument()
    expect(screen.getByText('현재 진행 중인 업무가 없습니다')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '새 업무 요청' }))
    expect(
      await screen.findByText('업무 생성 W-1 응우옌 안 근로자의 업무를 준비해 주세요'),
    ).toBeInTheDocument()
  })

  it('shows worker registration only when both workers and cases are empty', async () => {
    mockApi({ workers: workerPageResponse([]), cases: casePageResponse([]) })
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('등록된 근로자가 없습니다')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '근로자 등록' }))
    expect(await screen.findByText('근로자 등록 화면')).toBeInTheDocument()
  })

  it('filters the list to workers without active work', async () => {
    mockApi({
      workers: workerPageResponse([...WORKERS, worker('W-3', '김민지')]),
      cases: casePageResponse(CASES),
    })
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('option', { name: /응우옌 안/ })
    await user.click(screen.getByRole('button', { name: '업무 없음' }))

    expect(screen.getByRole('option', { name: /김민지.*업무 없음/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /응우옌 안/ })).not.toBeInTheDocument()
  })

  it('opens worker details and documents from a no-work worker', async () => {
    mockApi({ cases: casePageResponse([]) })
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '근로자 정보 보기' }))
    expect(await screen.findByText('근로자 상세 화면')).toBeInTheDocument()

    mockApi({ cases: casePageResponse([]) })
    renderPage()
    await user.click(await screen.findByRole('button', { name: '문서 확인' }))
    expect(await screen.findByText('문서함 화면')).toBeInTheDocument()
  })

  it('discloses pagination caps when only part of the case list has loaded', async () => {
    mockApi({ cases: casePageResponse(CASES, 140) })
    renderPage()

    expect(
      await screen.findByText(
        '일부 데이터만 불러왔습니다. 검색·정렬·진행률은 현재 불러온 범위 기준입니다.',
      ),
    ).toBeInTheDocument()
  })

  it('shows a dedicated empty state when unified search has no matches', async () => {
    mockApi()
    const user = userEvent.setup()
    renderPage()

    await user.type(
      await screen.findByLabelText('근로자·업무 건·지금 할 일 검색'),
      '존재하지 않는 검색어',
    )

    expect(await screen.findByText('검색 결과가 없습니다')).toBeInTheDocument()
  })

  it('switches between a worker\'s cases via "다른 Case 열기"', async () => {
    mockApi({
      cases: casePageResponse([
        ...CASES,
        caseSummary('CASE-3', 'W-1', '응우옌 안', {
          title: '근로자 안내문 준비',
          priority: 'LOW',
          due_date: isoDateOffset(20),
          current_task: currentTask({
            task_id: 'T-4',
            title: '근로자 안내문 초안',
            status: 'DRAFT',
            due_date: isoDateOffset(20),
          }),
        }),
      ]),
    })
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('option', { name: /응우옌 안/ }))

    expect(screen.getByText('우선 업무 건 · 1/2')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: '체류연장 업무 초안' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '다른 Case 열기 →' }))

    expect(screen.getByText('우선 업무 건 · 2/2')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: '근로자 안내문 초안' }),
    ).toBeInTheDocument()
  })

  it('labels each worker with the matching REVIEW-001 stage and links straight to it', async () => {
    mockApi()
    const user = userEvent.setup()
    renderPage()

    // CASE-1의 current_task는 READY_FOR_REVIEW 상태 -> 04 최종 검토로 라벨링된다.
    const option = await screen.findByRole('option', { name: /응우옌 안/ })
    const stageLink = within(option).getByRole('link', { name: '최종 검토' })
    expect(stageLink).toHaveAttribute('href', '/tasks/new/review?step=3')

    await user.click(stageLink)

    expect(await screen.findByText('업무 검토 화면')).toBeInTheDocument()
  })

  it('shows a placeholder toast for "근거 보기"', async () => {
    mockApi()
    const user = userEvent.setup()
    renderPage('/tasks', { withToasts: true })

    await user.click(await screen.findByRole('button', { name: '근거 보기' }))

    expect(screen.getByText('판단 근거 보기는 준비 중입니다.')).toBeInTheDocument()
  })
})
