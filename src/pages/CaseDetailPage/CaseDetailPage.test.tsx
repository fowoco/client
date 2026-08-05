import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuditEventResponse } from '../../api/audit'
import type {
  DocumentItemResponse,
  DocumentPageResponse,
  DocumentReadinessResponse,
} from '../../api/documents'
import type { TaskDetailResponse } from '../../api/tasks'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { CaseDetailPage } from './CaseDetailPage'
import { CASE_COMMUNICATION, CASE_TABS, CONTEXT_DRAWER } from './caseDetailData'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function errorResponse(status: number, code: string, message: string) {
  return jsonResponse(
    {
      timestamp: '2026-07-27T01:23:45Z',
      status,
      code,
      message,
      path: '/api/v1/tasks/T-1',
      request_id: 'req-1',
      field_errors: [],
    },
    { status },
  )
}

function task(overrides: Partial<TaskDetailResponse> = {}): TaskDetailResponse {
  return {
    task_id: 'T-1',
    worker_id: 'W-1',
    case_id: null,
    task_type: 'STAY_PERIOD_EXTENSION',
    workflow_id: 'wf-stay-extension',
    workflow_catalog_version: '1',
    title: '응웬반A 체류연장 준비',
    description: null,
    business_data: {},
    source: 'MANUAL',
    status: 'READY_FOR_REVIEW',
    due_date: '2026-08-01',
    content_revision: 1,
    version: 1,
    missing_required_slots: [],
    checklist_items: [
      {
        checklist_item_id: 'chk-1',
        item_code: 'passport',
        label: '여권 사본 확인',
        required: true,
        completed: true,
        completed_by: null,
        completed_at: null,
        version: 1,
      },
      {
        checklist_item_id: 'chk-2',
        item_code: 'signature',
        label: '근로자 서명 확인',
        required: true,
        completed: false,
        completed_by: null,
        completed_at: null,
        version: 1,
      },
    ],
    created_by: 'u-1',
    updated_by: 'u-1',
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

function activity(overrides: Partial<AuditEventResponse> = {}): AuditEventResponse {
  return {
    audit_event_id: 'evt-1',
    actor_type: 'AI_AGENT',
    actor_id: 'a-1',
    user_role: null,
    action: 'TASK_CREATED',
    target_type: 'TASK',
    target_id: 'T-1',
    request_id: 'req-1',
    trace_id: '0'.repeat(32),
    event_version: '1',
    change_summary: 'Agent가 체류연장 요청문 초안을 작성함',
    created_at: '2026-07-20T00:00:00Z',
    ...overrides,
  }
}

function readinessResponse(
  overrides: Partial<DocumentReadinessResponse> = {},
): DocumentReadinessResponse {
  return {
    required: [],
    available: [],
    missing: [],
    expired: [],
    completion_blocked: false,
    ...overrides,
  }
}

function documentsResponse(items: DocumentItemResponse[] = []): DocumentPageResponse {
  return { items, page: 0, size: 100, total_elements: items.length }
}

function mockTaskAndActivities(
  taskOverrides: Partial<TaskDetailResponse> = {},
  activities: AuditEventResponse[] = [],
  readinessOverrides: Partial<DocumentReadinessResponse> = {},
  documents: DocumentItemResponse[] = [],
) {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = String(input)
    if (url.includes('/activities')) return Promise.resolve(jsonResponse(activities))
    if (url.includes('/document-readiness'))
      return Promise.resolve(jsonResponse(readinessResponse(readinessOverrides)))
    if (url.includes('/document-request-draft')) {
      return Promise.resolve(
        jsonResponse({ draft_id: 'draft-1', version: 1, review_status: 'PENDING' }),
      )
    }
    if (url.includes('/documents?'))
      return Promise.resolve(jsonResponse(documentsResponse(documents)))
    if (url.includes('/approval-requests')) {
      return Promise.resolve(
        jsonResponse(
          { task_id: 'T-1', task_status: 'READY_FOR_REVIEW', task_version: 2 },
          { status: 201 },
        ),
      )
    }
    if (url.endsWith('/approve')) {
      return Promise.resolve(
        jsonResponse({ task_id: 'T-1', task_status: 'APPROVED', task_version: 2 }),
      )
    }
    if (url.endsWith('/reject')) {
      return Promise.resolve(
        jsonResponse({ task_id: 'T-1', task_status: 'DRAFT', task_version: 2 }),
      )
    }
    if (url.endsWith('/evidence')) {
      return Promise.resolve(
        jsonResponse(
          { resource_id: 'E-1', task_id: 'T-1', task_status: 'APPROVED', task_version: 1 },
          { status: 201 },
        ),
      )
    }
    if (url.endsWith('/complete')) {
      return Promise.resolve(
        jsonResponse({
          resource_id: 'T-1',
          task_id: 'T-1',
          task_status: 'COMPLETED',
          task_version: 2,
        }),
      )
    }
    if (url.endsWith('/worker-link')) {
      return Promise.resolve(
        jsonResponse(
          { worker_url: 'worker-token-1', expires_at: '2026-08-07T00:00:00Z' },
          { status: 201 },
        ),
      )
    }
    return Promise.resolve(jsonResponse(task(taskOverrides)))
  })
}

function mockTaskError(status: number, code: string, message: string) {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = String(input)
    if (url.includes('/activities')) return Promise.resolve(jsonResponse([]))
    if (url.includes('/document-readiness'))
      return Promise.resolve(jsonResponse(readinessResponse()))
    if (url.includes('/documents?')) return Promise.resolve(jsonResponse(documentsResponse()))
    return Promise.resolve(errorResponse(status, code, message))
  })
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/tasks/T-1']}>
      <Routes>
        <Route
          path="/tasks/:taskId"
          element={
            <>
              <CaseDetailPage />
              <ToastViewport />
            </>
          }
        />
        <Route path="/tasks" element={<p>업무함</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CaseDetailPage', () => {
  it('shows a loading state', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('업무 정보를 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an error state with a retry action', async () => {
    mockTaskError(404, 'RESOURCE_NOT_FOUND', 'raw')
    renderPage()

    expect(await screen.findByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })

  it('renders the real Task state without the static five-step demo', async () => {
    mockTaskAndActivities()
    renderPage()

    expect(await screen.findByText('응웬반A 체류연장 준비')).toBeInTheDocument()
    expect(screen.getAllByText('검토 필요').length).toBeGreaterThan(0)
    expect(screen.getByText('업무 진행')).toBeInTheDocument()
    expect(screen.getAllByText('1 / 2').length).toBeGreaterThan(0)
    expect(screen.queryByText('보안 링크 전달')).not.toBeInTheDocument()
  })

  it('switches to the checklist tab and toggles a real checklist item', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    const checklistTab = screen.getByRole('tab', { name: CASE_TABS[1] })
    await user.click(checklistTab)

    expect(checklistTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('여권 사본 확인')).toBeInTheDocument()

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(task()))
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        task({
          checklist_items: [
            {
              checklist_item_id: 'chk-1',
              item_code: 'passport',
              label: '여권 사본 확인',
              required: true,
              completed: false,
              completed_by: null,
              completed_at: null,
              version: 2,
            },
            {
              checklist_item_id: 'chk-2',
              item_code: 'signature',
              label: '근로자 서명 확인',
              required: true,
              completed: false,
              completed_by: null,
              completed_at: null,
              version: 1,
            },
          ],
        }),
      ),
    )
    await user.click(screen.getByText('여권 사본 확인'))

    const checklistPatchCall = await waitFor(() => {
      const call = vi
        .mocked(fetch)
        .mock.calls.find(([url]) => String(url).includes('/checklist-items/chk-1'))
      expect(call).toBeDefined()
      return call!
    })
    expect((checklistPatchCall[1] as RequestInit).method).toBe('PATCH')
    expect(JSON.parse((checklistPatchCall[1] as RequestInit).body as string)).toEqual({
      completed: false,
      expected_version: 1,
      expected_task_version: 1,
    })
  })

  it('switches to the document tab and shows real document content', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({}, [], {}, [
      {
        worker_document_id: 'doc-1',
        worker_id: 'W-1',
        display_name: null,
        document_type: 'PASSPORT_COPY',
        submission_status: 'VERIFIED',
        expiry_date: '2027-01-01',
        file_id: 'file-1',
      },
    ])
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('tab', { name: CASE_TABS[2] }))

    expect(await screen.findByText('여권 사본')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()
  })

  it('shows the document-readiness gate and saves a document request draft when documents are missing', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({}, [], { missing: ['ARC'], expired: [], completion_blocked: true }, [])
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    expect(await screen.findByText('누락 1건 · 만료 0건')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: CASE_TABS[2] }))
    await user.click(await screen.findByRole('button', { name: '요청 초안 저장 →' }))

    expect(await screen.findByText('서류 요청 초안을 저장했습니다.')).toBeInTheDocument()
  })

  it('switches to the communication tab and shows message content', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('tab', { name: CASE_TABS[3] }))

    expect(screen.getByText(CASE_COMMUNICATION[0].message)).toBeInTheDocument()
  })

  it('switches to the activity tab and shows real activity content', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({}, [activity()])
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('tab', { name: CASE_TABS[4] }))

    expect(screen.getByText('Agent가 체류연장 요청문 초안을 작성함')).toBeInTheDocument()
    expect(screen.getByText('Agent 초안')).toBeInTheDocument()
  })

  it('renders the blocked completion banner', async () => {
    mockTaskAndActivities()
    renderPage()

    expect(await screen.findByText(/완료 처리 불가 · 승인 · 필수 체크리스트/)).toBeInTheDocument()
  })

  it('requests approval through the API and refetches the Task', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({
      status: 'DRAFT',
      checklist_items: [
        {
          checklist_item_id: 'chk-1',
          item_code: 'passport',
          label: '여권 사본 확인',
          required: true,
          completed: true,
          completed_by: null,
          completed_at: null,
          version: 1,
        },
      ],
    })
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '승인 요청' }))
    expect(screen.getByRole('dialog', { name: '승인 요청' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '승인 요청 보내기' }))

    expect(screen.getByText('승인을 요청했습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const call = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes('/approval-requests'))
    expect(call?.[1]?.method).toBe('POST')
  })

  it('approves through the API instead of setting a local success state', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '승인 검토' }))
    expect(screen.getByRole('dialog', { name: '승인 요청을 검토하세요' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '승인' }))

    expect(screen.getByText('승인했습니다.')).toBeInTheDocument()
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/approve'))).toBe(true)
    expect(screen.queryByText('승인 완료')).not.toBeInTheDocument()
  })

  it('rejects through the API without fabricating a local rejected status', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '승인 검토' }))
    await user.click(screen.getByRole('button', { name: '반려' }))
    expect(screen.getByRole('dialog', { name: '반려 사유를 입력하세요' })).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('반려 사유를 입력하세요'), '마감일 불일치')
    await user.click(screen.getByRole('button', { name: '반려 확정' }))

    expect(screen.getByText('반려했습니다.')).toBeInTheDocument()
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/reject'))).toBe(true)
    expect(screen.queryByText('반려됨')).not.toBeInTheDocument()
  })

  it('opens and closes the more menu', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    const moreButton = screen.getByRole('button', { name: '더보기 ···' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.click(moreButton)
    expect(screen.getByRole('menu', { name: '업무 더보기 메뉴' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '취소' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '담당자 변경' })).toBeInTheDocument()

    await user.click(moreButton)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('cancels the task via the more menu when a reason is entered', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    vi.spyOn(window, 'prompt').mockReturnValue('중복 등록')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(task({ status: 'CANCELLED', version: 2 })))
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(task({ status: 'CANCELLED', version: 2 })))

    await user.click(screen.getByRole('button', { name: '더보기 ···' }))
    await user.click(screen.getByRole('menuitem', { name: '취소' }))

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await waitFor(() => {
      const cancelCall = vi
        .mocked(fetch)
        .mock.calls.find(([url]) => String(url).includes('/tasks/T-1/cancel'))
      expect(cancelCall).toBeDefined()
    })
    expect(await screen.findByText('업무를 취소했습니다.')).toBeInTheDocument()
  })

  it('does not cancel when the prompt is dismissed', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    vi.spyOn(window, 'prompt').mockReturnValue(null)

    await user.click(screen.getByRole('button', { name: '더보기 ···' }))
    await user.click(screen.getByRole('menuitem', { name: '취소' }))

    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes('/cancel'))).toBe(false)
  })

  it('closes the more menu when clicking outside', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '더보기 ···' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(screen.getByText('응웬반A 체류연장 준비'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens the context drawer with every section and closes on Escape', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({}, [activity()])
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '펼쳐 보기 →' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Agent가 확인한 내용')).toBeInTheDocument()
    expect(screen.getByText(CONTEXT_DRAWER.agentConfirmed[0])).toBeInTheDocument()
    expect(screen.getByText('부족한 정보')).toBeInTheDocument()
    expect(screen.getByText(CONTEXT_DRAWER.missingInfo[0])).toBeInTheDocument()
    expect(screen.getByText('공식 출처')).toBeInTheDocument()
    expect(screen.getByText(CONTEXT_DRAWER.officialSources[0].label)).toBeInTheDocument()
    expect(screen.getByText('최근 활동')).toBeInTheDocument()
    expect(screen.getByText('Agent가 체류연장 요청문 초안을 작성함')).toBeInTheDocument()
    expect(screen.getByText('HR이 할 일')).toBeInTheDocument()
    expect(screen.getByText(CONTEXT_DRAWER.hrTodo[0])).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('records evidence and completes through the API when the server Task is approved', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({
      status: 'APPROVED',
      checklist_items: [
        {
          checklist_item_id: 'chk-1',
          item_code: 'passport',
          label: '여권 사본 확인',
          required: true,
          completed: true,
          completed_by: null,
          completed_at: null,
          version: 1,
        },
      ],
    })
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(await screen.findByRole('button', { name: '완료 처리 시작 →' }))
    expect(screen.getByRole('dialog', { name: '외부기관 업무 완료' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '접수번호' }))
    await user.type(screen.getByPlaceholderText('접수번호를 입력하세요'), 'HI-2026-0718-032')
    await user.click(screen.getByLabelText('실제 제출은 담당자가 직접 수행했습니다.'))
    await user.click(
      within(screen.getByRole('dialog', { name: '외부기관 업무 완료' })).getByRole('button', {
        name: '완료 처리',
      }),
    )

    expect(screen.getByText('업무를 완료했습니다.')).toBeInTheDocument()
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/evidence'))).toBe(
      true,
    )
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/complete'))).toBe(
      true,
    )
  })

  it('issues the security link through the API and shows the real URL', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({ status: 'APPROVED' })
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '근로자 보안 링크 발급·재발급 →' }))
    const reissueDialog = screen.getByRole('dialog', { name: '보안 링크 재발급' })
    expect(within(reissueDialog).getByText('응웬반A 체류연장 준비')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '새 링크 생성' }))

    expect(screen.getByRole('dialog', { name: '새 링크가 준비되었습니다' })).toBeInTheDocument()
    expect(
      screen.getByText('http://localhost:3000/worker-portal/worker-token-1'),
    ).toBeInTheDocument()
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/worker-link'))).toBe(
      true,
    )
  })
})
