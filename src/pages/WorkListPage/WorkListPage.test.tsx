import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TaskPageResponse, TaskSummaryResponse } from '../../api/tasks'
import type { WorkerPageResponse, WorkerResponse } from '../../api/workers'
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
    stay_expiry_date: null,
    contract_start_date: null,
    contract_end_date: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    version: 1,
    ...overrides,
  }
}

function task(
  taskId: string,
  workerId: string,
  overrides: Partial<TaskSummaryResponse> = {},
): TaskSummaryResponse {
  return {
    task_id: taskId,
    worker_id: workerId,
    case_id: null,
    task_type: 'STAY_PERIOD_EXTENSION',
    workflow_id: 'wf-stay-extension',
    workflow_catalog_version: '1',
    title: `업무 ${taskId}`,
    source: 'MANUAL',
    status: 'DRAFT',
    due_date: null,
    content_revision: 1,
    version: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const WORKERS = [
  worker('W-1', '응우옌 안'),
  worker('W-2', '파티마 누르', { nationality_code: 'ID' }),
]

const TASKS = [
  task('T-1', 'W-1', {
    case_id: 'CASE-1',
    title: '체류연장 업무 초안',
    status: 'READY_FOR_REVIEW',
    due_date: isoDateOffset(5),
  }),
  task('T-2', 'W-1', {
    case_id: 'CASE-1',
    title: '여권 만료일 확인',
    status: 'COMPLETED',
    due_date: isoDateOffset(12),
  }),
  task('T-3', 'W-2', {
    case_id: 'CASE-2',
    workflow_id: 'wf-contract',
    task_type: 'RECONTRACT',
    title: '표준근로계약서 갱신',
    status: 'DRAFT',
    due_date: isoDateOffset(1),
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

function taskPageResponse(
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

function catalogResponse() {
  return {
    bundle_id: 'b-1',
    bundle_version: '1',
    bundle_status: 'ACTIVE',
    source_repository: 'fowoco/knowledge',
    generated_at: '2026-07-01T00:00:00Z',
    workflows: [
      {
        workflow_id: 'wf-stay-extension',
        name: '체류기간 연장',
        intent: '',
        sensitivity: 'normal',
        supported_task_types: ['STAY_PERIOD_EXTENSION'],
        required_slots: [],
        checklist_items: [],
        completion_evidence: [],
        source_ids: [],
      },
      {
        workflow_id: 'wf-contract',
        name: 'Contract Review',
        intent: '',
        sensitivity: 'normal',
        supported_task_types: ['RECONTRACT'],
        required_slots: [],
        checklist_items: [],
        completion_evidence: [],
        source_ids: [],
      },
    ],
  }
}

interface MockApiOptions {
  workers?: WorkerPageResponse | Response
  tasks?: TaskPageResponse | Response
  catalog?: ReturnType<typeof catalogResponse> | Response
}

function mockApi(options: MockApiOptions = {}) {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = String(input)
    if (url.includes('/workers')) {
      const value = options.workers ?? workerPageResponse(WORKERS)
      return Promise.resolve(value instanceof Response ? value : jsonResponse(value))
    }
    if (url.includes('/workflow-catalogs')) {
      const value = options.catalog ?? catalogResponse()
      return Promise.resolve(value instanceof Response ? value : jsonResponse(value))
    }
    const value = options.tasks ?? taskPageResponse(TASKS)
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

function renderPage(initialEntry = '/tasks') {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/tasks"
          element={
            <>
              <WorkListPage />
              <LocationProbe />
            </>
          }
        />
        <Route path="/tasks/:taskId" element={<TaskDetailProbe />} />
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

describe('WorkListPage', () => {
  it('joins workers and tasks into a selected master-detail view without N+1 requests', async () => {
    mockApi()
    renderPage()

    expect(await screen.findByRole('heading', { name: '응우옌 안', level: 2 })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '체류연장 업무 초안', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByText('진행 1/2')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', { name: /체류연장 업무 초안 Case 진행률/ }),
    ).toHaveAttribute('value', '1')

    const calledUrls = vi.mocked(fetch).mock.calls.map(([url]) => String(url))
    expect(calledUrls).toHaveLength(3)
    expect(calledUrls.some((url) => url.includes('/workers?'))).toBe(true)
    expect(calledUrls.some((url) => url.includes('/tasks?'))).toBe(true)
    expect(calledUrls.some((url) => url.includes('/workflow-catalogs'))).toBe(true)
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

  it('searches worker, task, workflow, and case fields in the loaded data', async () => {
    mockApi()
    const user = userEvent.setup()
    renderPage()

    const search = await screen.findByLabelText('근로자·Case·업무 검색')
    await user.type(search, 'Contract Review')

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /파티마 누르/ })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: /응우옌 안/ })).not.toBeInTheDocument()
    })

    const taskUrls = vi
      .mocked(fetch)
      .mock.calls.map(([url]) => String(url))
      .filter((url) => url.includes('/tasks?'))
    expect(taskUrls).toHaveLength(1)
    expect(taskUrls[0]).not.toContain('keyword=')

    await user.clear(search)
    await user.type(search, 'CASE-1')
    expect(await screen.findByRole('option', { name: /응우옌 안/ })).toBeInTheDocument()
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

    await user.click(await screen.findByRole('button', { name: 'Case 열기 →' }))

    expect(await screen.findByText('업무 상세 T-1')).toBeInTheDocument()
    expect(screen.queryByText('업무 상세 CASE-1')).not.toBeInTheDocument()
  })

  it('keeps the worker list visible when the Task API fails and retries only tasks', async () => {
    mockApi({ tasks: errorResponse('/api/v1/tasks') })
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByRole('option', { name: /응우옌 안/ })).toBeInTheDocument()
    expect(screen.getByText('연결된 업무를 불러오지 못했습니다')).toBeInTheDocument()

    const beforeRetry = vi
      .mocked(fetch)
      .mock.calls.filter(([url]) => String(url).includes('/tasks?')).length
    await user.click(screen.getByRole('button', { name: '다시 시도' }))
    await waitFor(() => {
      const afterRetry = vi
        .mocked(fetch)
        .mock.calls.filter(([url]) => String(url).includes('/tasks?')).length
      expect(afterRetry).toBeGreaterThan(beforeRetry)
    })
  })

  it('shows a blocking error when the Worker API fails', async () => {
    mockApi({ workers: errorResponse('/api/v1/workers') })
    renderPage()

    expect(await screen.findByText('근로자 정보를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByRole('listbox', { name: '업무 대상 근로자' })).not.toBeInTheDocument()
  })

  it('shows the empty work state and create action when there are no tasks', async () => {
    mockApi({ tasks: taskPageResponse([]) })
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('등록된 업무가 없습니다')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '업무 만들기' }))
    expect(await screen.findByText('업무 생성')).toBeInTheDocument()
  })

  it('falls back to task type labels if the workflow catalog fails', async () => {
    mockApi({ catalog: errorResponse('/api/v1/workflow-catalogs') })
    renderPage()

    expect(
      await screen.findByText('업무 분류 이름을 불러오지 못해 업무 유형으로 표시합니다.'),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/체류기간 연장/).length).toBeGreaterThan(0)
  })

  it('discloses pagination caps and hides unresolved worker references', async () => {
    mockApi({
      workers: workerPageResponse(WORKERS, 120),
      tasks: taskPageResponse(
        [...TASKS, task('T-orphan', 'W-missing', { title: '연결 오류 업무' })],
        140,
      ),
    })
    renderPage()

    expect(
      await screen.findByText(
        '일부 데이터만 불러왔습니다. 검색·정렬·진행률은 현재 불러온 범위 기준입니다.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('근로자 정보를 확인할 수 없는 업무 1건은 목록에서 제외했습니다.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('연결 오류 업무')).not.toBeInTheDocument()
  })

  it('shows a dedicated empty state when unified search has no matches', async () => {
    mockApi()
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('근로자·Case·업무 검색'), '존재하지 않는 검색어')

    expect(await screen.findByText('검색 결과가 없습니다')).toBeInTheDocument()
  })
})
