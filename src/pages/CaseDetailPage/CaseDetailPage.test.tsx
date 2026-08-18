import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuditEventResponse } from '../../api/audit'
import type { CaseProjectionResponse } from '../../api/cases'
import type {
  DocumentItemResponse,
  DocumentPageResponse,
  DocumentReadinessResponse,
  DocumentRequestDraftResponse,
} from '../../api/documents'
import type { TaskDetailResponse } from '../../api/tasks'
import type { WorkerLinkDeliveryResponse, WorkerResponseItemResponse } from '../../api/workerLinks'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { CaseDetailPage } from './CaseDetailPage'
import { CASE_TABS } from './caseDetailData'

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
    target_type: 'WORKER',
    worker_id: 'W-1',
    case_id: null,
    task_type: 'STAY_PERIOD_EXTENSION',
    workflow_id: 'wf-stay-extension',
    workflow_catalog_version: '1',
    title: '응웬반A 체류연장 준비',
    description: null,
    business_data: { renewal_execution: { scenario: 'ask_worker' } },
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

function caseProjectionResponse(
  overrides: Partial<CaseProjectionResponse> = {},
): CaseProjectionResponse {
  return {
    case_id: 'C-1',
    worker_id: 'W-1',
    worker_display_name: '응웬반A',
    title: '체류기간 연장',
    display_status: 'REVIEW_REQUIRED',
    has_unread_response: false,
    priority: 'HIGH',
    progress: { completed_steps: 1, total_steps: 2, percentage: 50 },
    due_date: '2026-08-01',
    current_task: {
      task_id: 'T-1',
      task_type: 'STAY_PERIOD_EXTENSION',
      title: '응웬반A 체류연장 준비',
      status: 'READY_FOR_REVIEW',
      due_date: '2026-08-01',
    },
    updated_at: '2026-07-20T00:00:00Z',
    lifecycle_status: 'ACTIVE',
    readiness: {
      completed_checklist_items: 1,
      total_checklist_items: 2,
      verified_documents: 2,
      total_documents: 3,
      pending_approvals: 1,
      approved_approvals: 0,
      worker_responses: 1,
      evidence_items: 0,
    },
    tasks: [
      {
        task_id: 'T-1',
        task_type: 'STAY_PERIOD_EXTENSION',
        title: '응웬반A 체류연장 준비',
        status: 'READY_FOR_REVIEW',
        due_date: '2026-08-01',
      },
    ],
    workflow_catalog_version: '1',
    workflow_snapshot: {},
    ...overrides,
  }
}

function mockTaskAndActivities(
  taskOverrides: Partial<TaskDetailResponse> = {},
  activities: AuditEventResponse[] = [],
  readinessOverrides: Partial<DocumentReadinessResponse> | Response = {},
  documents: DocumentItemResponse[] = [],
  workerResponses: WorkerResponseItemResponse[] = [],
  workerLinkDelivery: WorkerLinkDeliveryResponse | null = null,
  caseProjection: CaseProjectionResponse | null = null,
  savedDocumentRequestDraft: DocumentRequestDraftResponse | null = null,
  workerPreferredLanguage = 'ko',
) {
  let responsesReviewed = false
  let currentWorkerResponses = workerResponses
  let currentWorkerLinkDelivery = workerLinkDelivery
  let currentDocumentRequestDraft = savedDocumentRequestDraft
  vi.mocked(fetch).mockImplementation((input, init) => {
    const url = String(input)
    if (url.includes('/activities')) return Promise.resolve(jsonResponse(activities))
    if (url.includes('/workers/W-1')) {
      return Promise.resolve(
        jsonResponse({
          worker_id: 'W-1',
          company_id: 'C-1',
          display_name: '응웬반A',
          nationality_code: 'VN',
          preferred_language: workerPreferredLanguage,
          work_status: 'ACTIVE',
          visa_type: 'E-9',
          stay_expiry_date: '2026-08-01',
          contract_start_date: null,
          contract_end_date: null,
          employment_permit_end_date: null,
          employment_activity_end_date: null,
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-07-01T00:00:00Z',
          version: 1,
        }),
      )
    }
    if (url.includes('/cases/') && url.endsWith('/projection')) {
      return Promise.resolve(
        caseProjection
          ? jsonResponse(caseProjection)
          : errorResponse(404, 'CASE_NOT_FOUND', 'Case 없음'),
      )
    }
    if (url.endsWith('/worker-responses/read')) {
      responsesReviewed = true
      return Promise.resolve(new Response(null, { status: 204 }))
    }
    if (url.includes('/worker-responses/') && url.endsWith('/documents/adopt')) {
      currentWorkerResponses = currentWorkerResponses.map((response) => ({
        ...response,
        uploads: response.uploads.map((upload) => ({ ...upload, adopted: true })),
      }))
      return Promise.resolve(
        jsonResponse({
          response_id: 'response-1',
          adopted_documents:
            currentWorkerResponses[0]?.uploads.map((upload) => ({
              worker_document_id: `document-${upload.file_id}`,
              file_id: upload.file_id,
              document_type: upload.document_type,
            })) ?? [],
          task_status: 'APPROVED',
          task_version: 2,
        }),
      )
    }
    if (url.includes('/worker-responses?')) {
      const items = currentWorkerResponses.map((response) =>
        responsesReviewed
          ? { ...response, unread: false, conversation_status: 'REOPENED' as const }
          : response,
      )
      return Promise.resolve(
        jsonResponse({
          items,
          page: 0,
          size: 100,
          total_elements: items.length,
          total_pages: items.length ? 1 : 0,
        }),
      )
    }
    if (url.includes('/document-readiness')) {
      return Promise.resolve(
        readinessOverrides instanceof Response
          ? readinessOverrides
          : jsonResponse(readinessResponse(readinessOverrides)),
      )
    }
    if (url.includes('/document-request-draft')) {
      if (init?.method !== 'PUT') {
        return Promise.resolve(
          currentDocumentRequestDraft
            ? jsonResponse(currentDocumentRequestDraft)
            : errorResponse(404, 'DOCUMENT_REQUEST_DRAFT_NOT_FOUND', '초안 없음'),
        )
      }
      const body = JSON.parse(String(init.body)) as {
        language: string
        document_types: DocumentRequestDraftResponse['document_types']
        message: string
        expected_version: number
      }
      if (
        currentDocumentRequestDraft &&
        body.expected_version !== currentDocumentRequestDraft.version
      ) {
        return Promise.resolve(errorResponse(409, 'VERSION_CONFLICT', '초안 버전 충돌'))
      }
      currentDocumentRequestDraft = {
        draft_id: currentDocumentRequestDraft?.draft_id ?? 'draft-1',
        language: body.language,
        document_types: body.document_types,
        message: body.message,
        version: currentDocumentRequestDraft ? currentDocumentRequestDraft.version + 1 : 0,
        review_status: 'DRAFT',
        updated_at: '2026-08-08T00:00:00Z',
      }
      return Promise.resolve(jsonResponse(currentDocumentRequestDraft))
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
    if (url.endsWith('/external-submissions')) {
      return Promise.resolve(
        jsonResponse(
          {
            resource_id: 'S-1',
            task_id: 'T-1',
            task_status: 'WAITING_EXTERNAL',
            task_version: 2,
          },
          { status: 201 },
        ),
      )
    }
    if (url.endsWith('/evidence')) {
      return Promise.resolve(
        jsonResponse(
          {
            resource_id: 'E-1',
            task_id: 'T-1',
            task_status: 'WAITING_EXTERNAL',
            task_version: 2,
          },
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
      if (init?.method !== 'POST') {
        return Promise.resolve(
          currentWorkerLinkDelivery
            ? jsonResponse(currentWorkerLinkDelivery)
            : errorResponse(404, 'WORKER_LINK_RESOURCE_NOT_FOUND', '근로자 링크 없음'),
        )
      }
      currentWorkerLinkDelivery = {
        worker_link_id: 'L-1',
        link_status: 'ACTIVE',
        delivery_status: 'NOT_SENT',
        sent_at: null,
        expires_at: '2026-08-07T00:00:00Z',
      }
      return Promise.resolve(
        jsonResponse(
          {
            worker_link_id: 'L-1',
            worker_url: 'worker-token-1',
            expires_at: '2026-08-07T00:00:00Z',
            delivery_status: 'NOT_SENT',
            sent_at: null,
            already_issued: false,
          },
          { status: 201 },
        ),
      )
    }
    if (url.endsWith('/worker-links/L-1/sent')) {
      currentWorkerLinkDelivery = {
        worker_link_id: 'L-1',
        link_status: 'ACTIVE',
        delivery_status: 'SENT',
        sent_at: '2026-08-05T01:00:00Z',
        expires_at: '2026-08-07T00:00:00Z',
      }
      return Promise.resolve(jsonResponse(currentWorkerLinkDelivery))
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
    if (url.includes('/worker-responses?')) {
      return Promise.resolve(
        jsonResponse({ items: [], page: 0, size: 100, total_elements: 0, total_pages: 0 }),
      )
    }
    if (url.endsWith('/worker-link')) {
      return Promise.resolve(
        errorResponse(404, 'WORKER_LINK_RESOURCE_NOT_FOUND', '근로자 링크 없음'),
      )
    }
    return Promise.resolve(errorResponse(status, code, message))
  })
}

beforeEach(() => {
  useAuthStore.setState({ user: null, status: 'ready' })
  useToastStore.setState({ toasts: [] })
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function renderPage(initialEntry = '/tasks/T-1') {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
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
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:file-1')
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickAnchor = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    mockTaskAndActivities({}, [], {}, [
      {
        worker_document_id: 'doc-1',
        worker_id: 'W-1',
        display_name: null,
        document_type: 'PASSPORT_COPY',
        submission_status: 'VERIFIED',
        source: 'WORKER_UPLOAD',
        expiry_date: '2027-01-01',
        file_id: 'file-1',
      },
    ])
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('tab', { name: CASE_TABS[2] }))

    expect(await screen.findByText('여권 사본 · 근로자 제출')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '여권 사본 · 근로자 제출' })).toHaveAttribute(
      'href',
      '/documents/doc-1',
    )
    const documentListRequest = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes('/documents?'))
    expect(documentListRequest?.[0]).toContain('workerId=W-1')
    expect(documentListRequest?.[0]).toContain('taskId=T-1')

    await user.click(screen.getByRole('button', { name: '다운로드' }))

    expect(createObjectUrl).toHaveBeenCalledTimes(1)
    expect(clickAnchor).toHaveBeenCalledTimes(1)
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:file-1')
  })

  it('shows the document-readiness gate and saves a document request draft when documents are missing', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({}, [], { missing: ['ARC'], expired: [], completion_blocked: true }, [])
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    expect(await screen.findByText('누락 1건 · 만료 0건')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: CASE_TABS[2] }))
    await user.click(await screen.findByRole('button', { name: '요청 초안 저장' }))

    expect(await screen.findByText('서류 요청 초안을 저장했습니다.')).toBeInTheDocument()
    const saveCall = vi
      .mocked(fetch)
      .mock.calls.find(
        ([url, init]) => String(url).includes('/document-request-draft') && init?.method === 'PUT',
      )
    expect(JSON.parse(String(saveCall?.[1]?.body))).toMatchObject({
      document_types: ['ARC'],
      message: '다음 서류를 제출해 주세요: 외국인등록증.',
      expected_version: 0,
    })
  })

  it('prepares an HR-editable request draft for OCR fields even when document metadata exists', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({
      status: 'APPROVED',
      business_data: {
        renewal_execution: {
          scenario: 'ask_worker',
          requested_fields: [
            { key: 'passport_number', source_hint: 'DOCUMENT_OCR' },
            { key: 'alien_registration_number', source_hint: 'DOCUMENT_OCR' },
          ],
        },
      },
    })
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    expect(screen.getByRole('button', { name: '먼저 근로자 안내 초안 준비 →' })).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: '근로자 보안 링크 발급·재발급 →' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '먼저 근로자 안내 초안 준비 →' }))
    expect(await screen.findByText('여권 사본')).toBeInTheDocument()
    expect(screen.getByText('외국인등록증')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '요청 초안 저장' }))
    expect(await screen.findByText('서류 요청 초안을 저장했습니다.')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: CASE_TABS[0] }))
    expect(
      await screen.findByRole('button', { name: '근로자 보안 링크 발급·재발급 →' }),
    ).toBeEnabled()
  })

  it('restores and updates a saved document request draft', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities(
      {},
      [],
      { missing: ['ARC'], completion_blocked: true },
      [],
      [],
      null,
      null,
      {
        draft_id: 'draft-1',
        language: 'vi',
        document_types: ['PASSPORT_COPY', 'CONTRACT'],
        message: 'Vui lòng nộp hộ chiếu và hợp đồng lao động.',
        version: 3,
        review_status: 'DRAFT',
        updated_at: '2026-08-08T00:00:00Z',
      },
    )
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')
    await user.click(screen.getByRole('tab', { name: CASE_TABS[2] }))

    expect(
      await screen.findByDisplayValue('Vui lòng nộp hộ chiếu và hợp đồng lao động.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('안내 언어')).toHaveValue('vi')
    expect(screen.getByText('저장본 v3')).toBeInTheDocument()

    const message = screen.getByLabelText('근로자 안내문')
    await user.clear(message)
    await user.type(message, '수정된 안내문')
    await user.click(screen.getByRole('button', { name: '요청 초안 저장' }))

    const updateCall = await waitFor(() => {
      const call = vi
        .mocked(fetch)
        .mock.calls.find(
          ([url, init]) =>
            String(url).includes('/document-request-draft') && init?.method === 'PUT',
        )
      expect(call).toBeDefined()
      return call!
    })
    expect(JSON.parse(String(updateCall[1]?.body))).toMatchObject({
      message: '수정된 안내문',
      expected_version: 3,
    })
    expect(await screen.findByText('저장본 v4')).toBeInTheDocument()
  })

  it('uses the worker language and requires HR text when guide generation needs review', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities(
      {
        business_data: {
          renewal_execution: {
            guide_review_required: true,
            guide_failure_code: 'LANGUAGE_ASSISTANT_INVOCATION_FAILED',
          },
        },
      },
      [],
      { missing: ['ARC'], completion_blocked: true },
      [],
      [],
      null,
      null,
      null,
      'vi',
    )
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('tab', { name: CASE_TABS[2] }))

    expect(await screen.findByRole('alert')).toHaveTextContent('근로자 안내문을 직접 검토해 주세요')
    expect(screen.getByLabelText('안내 언어')).toHaveValue('vi')
    expect(screen.getByLabelText('근로자 안내문')).toHaveValue('')
    expect(screen.queryByText('LANGUAGE_ASSISTANT_INVOCATION_FAILED')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '요청 초안 저장' }))
    expect(await screen.findByText('근로자에게 표시할 안내문을 입력해 주세요.')).toBeInTheDocument()
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(
          ([url, init]) =>
            String(url).includes('/document-request-draft') && init?.method === 'PUT',
        ),
    ).toBe(false)
  })

  it('shows real unread worker responses and marks them as reviewed', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities(
      {},
      [],
      {},
      [],
      [
        {
          response_id: 'response-1',
          response_type: 'DOCUMENT_SUBMITTED',
          message: '여권 사본을 제출했습니다.',
          upload_ids: ['upload-1'],
          uploads: [
            {
              file_id: 'upload-1',
              file_name: 'passport.pdf',
              mime_type: 'application/pdf',
              size: 2048,
              document_type: 'PASSPORT_COPY',
              adopted: false,
            },
          ],
          conversation_status: 'NEEDS_FOLLOWUP',
          unread: true,
          received_at: '2026-07-20T01:00:00Z',
        },
      ],
    )
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('tab', { name: CASE_TABS[3] }))

    expect(screen.getByText('승인대기')).toBeInTheDocument()
    expect(screen.getByText('여권 사본을 제출했습니다.')).toBeInTheDocument()
    expect(screen.getByText('passport.pdf')).toBeInTheDocument()
    expect(screen.getByText(/여권 사본 · 2KB · 검토 필요/)).toBeInTheDocument()
    expect(screen.queryByText('여권 사본 요청문 초안을 준비했습니다.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '응답 확인 완료' }))

    expect(await screen.findByText('근로자 응답을 확인 처리했습니다.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('확인됨')).toBeInTheDocument()
    })
    expect(
      vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/worker-responses/read')),
    ).toBe(true)
  })

  it('shows a worker-response empty state instead of static demo messages', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('tab', { name: CASE_TABS[3] }))

    expect(screen.getByText('서류대기')).toBeInTheDocument()
    expect(screen.getByText('도착한 근로자 응답이 없습니다')).toBeInTheDocument()
  })

  it('uses the persisted link delivery status and records delivery after confirmation', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({}, [], {}, [], [], {
      worker_link_id: 'L-1',
      link_status: 'ACTIVE',
      delivery_status: 'NOT_SENT',
      sent_at: null,
      expires_at: '2026-08-07T00:00:00Z',
    })
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('tab', { name: CASE_TABS[3] }))

    expect(screen.getByText('서류대기')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '전달 완료 기록' }))
    expect(screen.getByRole('dialog', { name: '링크 전달 완료 기록' })).toBeInTheDocument()

    await user.click(screen.getByLabelText('근로자에게 링크를 직접 전달했습니다.'))
    await user.click(screen.getByRole('button', { name: '전달 완료로 기록' }))

    expect(await screen.findByText('근로자 링크 전달 완료를 기록했습니다.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('요청전송')).toBeInTheDocument())
    expect(
      vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/worker-links/L-1/sent')),
    ).toBe(true)
  })

  it('does not offer the response review action to a viewer', async () => {
    const user = userEvent.setup()
    useAuthStore.setState({
      user: {
        name: 'viewer',
        phone: null,
        email: 'viewer@example.com',
        workplace: 'FOWOCO',
        role: 'VIEWER',
      },
      status: 'ready',
    })
    mockTaskAndActivities(
      {},
      [],
      {},
      [],
      [
        {
          response_id: 'response-1',
          response_type: 'QUESTION',
          message: '어떤 서류가 필요한가요?',
          upload_ids: [],
          uploads: [],
          conversation_status: 'NEEDS_FOLLOWUP',
          unread: true,
          received_at: '2026-07-20T01:00:00Z',
        },
      ],
    )
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('tab', { name: CASE_TABS[3] }))

    expect(screen.getByText('미확인')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '응답 확인 완료' })).not.toBeInTheDocument()
  })

  it('adopts a submitted file as an official worker document', async () => {
    const user = userEvent.setup()
    useAuthStore.setState({
      user: { name: 'hr', phone: null, email: 'hr@example.com', workplace: 'FOWOCO', role: 'HR' },
      status: 'ready',
    })
    mockTaskAndActivities(
      { status: 'WAITING_WORKER', version: 3 },
      [],
      {},
      [],
      [
        {
          response_id: 'response-1',
          response_type: 'DOCUMENT_SUBMITTED',
          message: '여권을 제출했습니다.',
          upload_ids: ['upload-1'],
          uploads: [
            {
              file_id: 'upload-1',
              file_name: 'passport.pdf',
              mime_type: 'application/pdf',
              size: 2048,
              document_type: 'PASSPORT_COPY',
              adopted: false,
            },
          ],
          conversation_status: 'NEEDS_FOLLOWUP',
          unread: true,
          received_at: '2026-07-20T01:00:00Z',
        },
      ],
    )
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('tab', { name: CASE_TABS[3] }))
    await user.click(screen.getByRole('button', { name: '확인 후 공식 서류로 등록' }))

    expect(
      await screen.findByText('제출 파일을 공식 근로자 서류로 등록했습니다.'),
    ).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/공식 서류 등록됨/)).toBeInTheDocument())
    const adoptionCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).endsWith('/documents/adopt'))
    expect(JSON.parse(String(adoptionCall?.[1]?.body))).toEqual({ expected_task_version: 3 })
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

  it('keeps a completed Task completed instead of showing approval blockers again', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({ status: 'COMPLETED' }, [activity()])
    renderPage()

    expect(
      await screen.findByText('응웬반A 체류연장 준비 업무를 완료했습니다.'),
    ).toBeInTheDocument()
    const approvalLabel = screen.getByText('요청문 승인')
    expect(within(approvalLabel.parentElement as HTMLElement).getByText('완료')).toBeInTheDocument()
    expect(
      screen.queryByText('승인 전에는 근로자 링크 전달이나 외부 처리를 시작할 수 없습니다.'),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '완료 처리' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '활동 이력 확인' }))

    expect(screen.getByText('Agent가 체류연장 요청문 초안을 작성함')).toBeInTheDocument()
  })

  it('renders the blocked completion banner', async () => {
    mockTaskAndActivities()
    renderPage()

    expect(await screen.findByText(/완료 처리 불가 · 승인 · 필수 체크리스트/)).toBeInTheDocument()
  })

  it('offers a visible action that opens the checklist required for progress', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '필수 항목 확인하기' }))

    expect(screen.getByRole('tab', { name: '체크리스트' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: /여권 사본 확인/ })).toBeInTheDocument()
  })

  it('blocks completion and offers retry when document readiness cannot be verified', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({}, [], errorResponse(503, 'SERVICE_UNAVAILABLE', '서류 상태 확인 지연'))
    renderPage()

    expect(await screen.findByText('조회 실패')).toBeInTheDocument()
    expect(screen.getByText('서류 상태 확인 지연')).toBeInTheDocument()
    expect(screen.getByText(/완료 처리 불가.*서류 상태 확인/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '다시 조회 →' }))

    expect(
      vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes('/document-readiness')),
    ).toHaveLength(2)
  })

  it('requests approval through the API and refetches the Task', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({
      status: 'DRAFT',
      business_data: { renewal_execution: { scenario: 'ask_worker' } },
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

  it('allows an approval request before missing worker documents are collected', async () => {
    mockTaskAndActivities(
      {
        status: 'DRAFT',
        business_data: { renewal_execution: { scenario: 'ask_worker' } },
        checklist_items: [
          {
            checklist_item_id: 'chk-1',
            item_code: 'passport',
            label: '여권 사본 확인',
            required: true,
            completed: true,
            completed_by: 'u-1',
            completed_at: '2026-08-16T00:00:00Z',
            version: 2,
          },
        ],
      },
      [],
      { missing: ['ARC'], expired: [], completion_blocked: true },
    )
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    expect(screen.getByRole('button', { name: '승인 요청' })).toBeEnabled()
    expect(screen.getByText('누락 1건 · 만료 0건')).toBeInTheDocument()
  })

  it('requires Renewal preparation before requesting approval for a renewal task', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({
      status: 'DRAFT',
      business_data: {},
      checklist_items: [
        {
          checklist_item_id: 'chk-1',
          item_code: 'passport',
          label: '여권 사본 확인',
          required: true,
          completed: true,
          completed_by: 'u-1',
          completed_at: '2026-08-16T00:00:00Z',
          version: 2,
        },
      ],
    })
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    expect(screen.getByRole('button', { name: '승인 요청' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Renewal 실행' }))
    expect(screen.getByRole('dialog', { name: 'Renewal Agent 실행' })).toBeInTheDocument()
  })

  it('keeps Renewal retry available while waiting for worker information', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({ status: 'WAITING_WORKER' })
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '더보기 ···' }))
    await user.click(screen.getByRole('menuitem', { name: 'Renewal 실행' }))

    expect(screen.getByRole('dialog', { name: 'Renewal Agent 실행' })).toBeInTheDocument()
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
    mockTaskAndActivities({ status: 'DRAFT' })
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    const moreButton = screen.getByRole('button', { name: '더보기 ···' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.click(moreButton)
    expect(screen.getByRole('menu', { name: '업무 더보기 메뉴' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '취소' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '담당자 변경' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Renewal 실행' })).toBeInTheDocument()

    await user.click(moreButton)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('does not show Renewal 실행 for non-renewal task types', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({ task_type: 'DOCUMENT_REQUEST' })
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '더보기 ···' }))
    expect(screen.queryByRole('menuitem', { name: 'Renewal 실행' })).not.toBeInTheDocument()
  })

  it('opens the Renewal execution modal from the more menu', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({ status: 'DRAFT' })
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '더보기 ···' }))
    await user.click(screen.getByRole('menuitem', { name: 'Renewal 실행' }))

    expect(screen.getByRole('dialog', { name: 'Renewal Agent 실행' })).toBeInTheDocument()
  })

  it('shows a toast when the assignee change action is clicked', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities()
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(screen.getByRole('button', { name: '더보기 ···' }))
    await user.click(screen.getByRole('menuitem', { name: '담당자 변경' }))

    expect(screen.getByText('담당자 변경은 준비 중입니다.')).toBeInTheDocument()
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

  it('opens the context drawer with the real Case projection and closes on Escape', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities(
      { case_id: 'C-1' },
      [activity()],
      {},
      [],
      [],
      null,
      caseProjectionResponse(),
    )
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '펼쳐 보기 →' }))

    const drawer = screen.getByRole('dialog')
    expect(drawer).toBeInTheDocument()
    expect(within(drawer).getByText('Case 현황')).toBeInTheDocument()
    expect(within(drawer).getByText('준비 현황')).toBeInTheDocument()
    expect(within(drawer).getByText('검증 서류')).toBeInTheDocument()
    expect(within(drawer).getByText('2 / 3')).toBeInTheDocument()
    expect(within(drawer).getByText('연결된 업무')).toBeInTheDocument()
    expect(within(drawer).getByText('체류기간 연장 · 검토 필요')).toBeInTheDocument()
    expect(within(drawer).getByText('최근 활동')).toBeInTheDocument()
    expect(within(drawer).getByText('Agent가 체류연장 요청문 초안을 작성함')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the real Case context immediately from a context deep link', async () => {
    mockTaskAndActivities(
      { case_id: 'C-1' },
      [activity()],
      {},
      [],
      [],
      null,
      caseProjectionResponse(),
    )

    renderPage('/tasks/T-1?context=open')

    const drawer = await screen.findByRole('dialog', { name: '관련 Context' })
    expect(await within(drawer).findByText('Case 현황')).toBeInTheDocument()
    expect(within(drawer).getByText('응웬반A')).toBeInTheDocument()
    expect(
      vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/cases/C-1/projection')),
    ).toBe(true)
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

    await user.type(screen.getByLabelText('제출 기관'), '수원출입국·외국인청')
    await user.click(screen.getByRole('button', { name: '접수번호' }))
    await user.type(screen.getByPlaceholderText('접수번호를 입력하세요'), 'HI-2026-0718-032')
    await user.click(screen.getByLabelText('실제 제출은 담당자가 직접 수행했습니다.'))
    await user.click(
      within(screen.getByRole('dialog', { name: '외부기관 업무 완료' })).getByRole('button', {
        name: '완료 처리',
      }),
    )

    expect(screen.getByText('업무를 완료했습니다.')).toBeInTheDocument()
    expect(
      vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/external-submissions')),
    ).toBe(true)
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/evidence'))).toBe(
      true,
    )
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/complete'))).toBe(
      true,
    )
  })

  it('does not duplicate the external submission when retrying from WAITING_EXTERNAL', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({
      status: 'WAITING_EXTERNAL',
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
    expect(screen.queryByLabelText('제출 기관')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '접수번호' }))
    await user.type(screen.getByPlaceholderText('접수번호를 입력하세요'), 'HI-2026-0718-032')
    await user.click(screen.getByLabelText('실제 제출은 담당자가 직접 수행했습니다.'))
    await user.click(
      within(screen.getByRole('dialog', { name: '외부기관 업무 완료' })).getByRole('button', {
        name: '완료 처리',
      }),
    )

    expect(await screen.findByText('업무를 완료했습니다.')).toBeInTheDocument()
    expect(
      vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/external-submissions')),
    ).toBe(false)
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/evidence'))).toBe(
      true,
    )
  })

  it('issues the security link through the API and shows the real URL', async () => {
    const user = userEvent.setup()
    mockTaskAndActivities({ status: 'APPROVED' }, [], {}, [], [], null, null, {
      draft_id: 'draft-1',
      language: 'vi',
      document_types: ['PASSPORT_COPY'],
      message: 'Vui lòng nộp bản sao hộ chiếu.',
      version: 1,
      review_status: 'DRAFT',
      updated_at: '2026-08-16T00:00:00Z',
    })
    renderPage()
    await screen.findByText('응웬반A 체류연장 준비')

    await user.click(await screen.findByRole('button', { name: '근로자 보안 링크 발급·재발급 →' }))
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
    expect(screen.getByRole('button', { name: '전달 완료 기록' })).toBeEnabled()
  })
})
