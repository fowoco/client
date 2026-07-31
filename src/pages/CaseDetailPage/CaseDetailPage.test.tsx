import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuditEventResponse } from '../../api/audit'
import type { TaskDetailResponse } from '../../api/tasks'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { CaseDetailPage } from './CaseDetailPage'
import { CASE_COMMUNICATION, CASE_DOCUMENTS, CASE_STEPS, CASE_TABS, CONTEXT_DRAWER } from './caseDetailData'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init })
}

function errorResponse(status: number, code: string, message: string) {
  return jsonResponse(
    { timestamp: '2026-07-27T01:23:45Z', status, code, message, path: '/api/v1/tasks/T-1', request_id: 'req-1', field_errors: [] },
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
      { checklist_item_id: 'chk-1', item_code: 'passport', label: '여권 사본 확인', required: true, completed: true, completed_by: null, completed_at: null, version: 1 },
      { checklist_item_id: 'chk-2', item_code: 'signature', label: '근로자 서명 확인', required: true, completed: false, completed_by: null, completed_at: null, version: 1 },
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

function mockTaskAndActivities(taskOverrides: Partial<TaskDetailResponse> = {}, activities: AuditEventResponse[] = []) {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = String(input)
    if (url.includes('/activities')) return Promise.resolve(jsonResponse(activities))
    return Promise.resolve(jsonResponse(task(taskOverrides)))
  })
}

function mockTaskError(status: number, code: string, message: string) {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = String(input)
    if (url.includes('/activities')) return Promise.resolve(jsonResponse([]))
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

  it('renders the real task title/status and every demo agent step', async () => {
    mockTaskAndActivities()
    renderPage()

    expect(await screen.findByText('응웬반A 체류연장 준비')).toBeInTheDocument()
    expect(screen.getByText('검토 필요')).toBeInTheDocument()
    for (const step of CASE_STEPS) {
      expect(screen.getByText(step.title)).toBeInTheDocument()
    }
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
            { checklist_item_id: 'chk-1', item_code: 'passport', label: '여권 사본 확인', required: true, completed: false, completed_by: null, completed_at: null, version: 2 },
            { checklist_item_id: 'chk-2', item_code: 'signature', label: '근로자 서명 확인', required: true, completed: false, completed_by: null, completed_at: null, version: 1 },
          ],
        }),
      ),
    )
    await user.click(screen.getByText('여권 사본 확인'))

    const checklistPatchCall = await waitFor(() => {
      const call = vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes('/checklist-items/chk-1'))
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

  it('switches to the document tab and shows document content', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('tab', { name: CASE_TABS[2] }))

    expect(screen.getByText(CASE_DOCUMENTS[0].name)).toBeInTheDocument()
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

    expect(await screen.findByText('완료 처리 불가 · 승인과 증빙 필요')).toBeInTheDocument()
  })

  it('shows a toast when a draft is saved', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '초안 저장' }))

    expect(screen.getByText('초안을 저장했습니다.')).toBeInTheDocument()
  })

  it('opens the approval request modal and shows a toast on submit', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '승인 요청' }))
    expect(screen.getByRole('dialog', { name: '승인 요청' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '승인 요청 보내기' }))

    expect(screen.getByText('승인을 요청했습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('walks through the approve decision flow', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '데모: 승인자로 검토' }))
    expect(screen.getByRole('dialog', { name: '승인 요청을 검토하세요' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '승인' }))

    expect(screen.getByText('승인했습니다.')).toBeInTheDocument()
    expect(screen.getAllByText('승인 완료').length).toBeGreaterThan(0)
  })

  it('walks through the reject decision flow', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '데모: 승인자로 검토' }))
    await user.click(screen.getByRole('button', { name: '반려' }))
    expect(screen.getByRole('dialog', { name: '반려 사유를 입력하세요' })).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('반려 사유를 입력하세요'), '마감일 불일치')
    await user.click(screen.getByRole('button', { name: '반려 확정' }))

    expect(screen.getByText('반려했습니다.')).toBeInTheDocument()
    expect(screen.getAllByText('반려됨').length).toBeGreaterThan(0)
  })

  it('shows the other-approver-handled overlay after a decision is already made', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '데모: 승인자로 검토' }))
    await user.click(screen.getByRole('button', { name: '승인' }))

    await user.click(screen.getByRole('button', { name: '데모: 승인자로 검토' }))

    expect(screen.getByRole('dialog', { name: '다른 승인자가 처리했습니다' })).toBeInTheDocument()
  })

  it('opens the snapshot diff overlay and re-requests approval', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '데모: 재승인 필요 보기' }))
    expect(screen.getByRole('dialog', { name: '승인본 V1 · 수정본 V2 변경 내용' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '재승인 요청' }))

    expect(screen.getByText('재승인을 요청했습니다.')).toBeInTheDocument()
    expect(screen.getAllByText('승인 대기').length).toBeGreaterThan(0)
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
      const cancelCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes('/tasks/T-1/cancel'))
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

  it('blocks completion until approved, then completes via the external completion overlay', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    expect(screen.queryByRole('button', { name: '완료 처리 시작 →' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '데모: 승인자로 검토' }))
    await user.click(screen.getByRole('button', { name: '승인' }))

    await user.click(screen.getByRole('button', { name: '완료 처리 시작 →' }))
    expect(screen.getByRole('dialog', { name: '외부기관 업무 완료' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '접수번호' }))
    await user.type(screen.getByPlaceholderText('접수번호를 입력하세요'), 'HI-2026-0718-032')
    await user.click(screen.getByLabelText('실제 제출은 담당자가 직접 수행했습니다.'))
    await user.click(screen.getByRole('button', { name: '완료 처리' }))

    expect(screen.getByText('완료 처리했습니다.')).toBeInTheDocument()
    expect(screen.getByText('완료 처리되었습니다.')).toBeInTheDocument()
  })

  it('opens the internal completion demo overlay independent of approval state', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '데모: 내부업무 완료 보기' }))
    expect(screen.getByRole('dialog', { name: '일반 내부업무 완료' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '파일 없이 완료' }))

    expect(screen.getByText('(데모) 내부업무를 완료 처리했습니다.')).toBeInTheDocument()
  })
})
