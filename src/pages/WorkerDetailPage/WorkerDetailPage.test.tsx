import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DocumentItemResponse, WorkerDocumentResponse } from '../../api/documents'
import type { TaskSummaryResponse } from '../../api/tasks'
import type { WorkerResponse } from '../../api/workers'
import type { StayVerificationResponse } from '../../api/stayVerifications'
import { WorkerDetailPage } from './WorkerDetailPage'

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
      path: '/api/v1/workers/W-1',
      request_id: 'req-1',
      field_errors: [],
    },
    { status },
  )
}

function worker(overrides: Partial<WorkerResponse> = {}): WorkerResponse {
  return {
    worker_id: 'W-018',
    company_id: 'C-1',
    display_name: '쩐티B',
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

function document(overrides: Partial<DocumentItemResponse> = {}): DocumentItemResponse {
  return {
    worker_document_id: 'D-1',
    worker_id: 'W-018',
    display_name: '쩐티B',
    document_type: 'CONTRACT',
    submission_status: 'SUBMITTED',
    source: 'LEGACY',
    expiry_date: '2027-07-18',
    file_id: 'F-1',
    ...overrides,
  }
}

function task(overrides: Partial<TaskSummaryResponse> = {}): TaskSummaryResponse {
  return {
    task_id: 'T-1',
    target_type: 'WORKER',
    worker_id: 'W-018',
    case_id: null,
    task_type: 'DOCUMENT_REQUEST',
    workflow_id: 'WF-DOC-001',
    workflow_catalog_version: '1',
    title: '여권 사본 요청',
    source: 'MANUAL',
    status: 'WAITING_WORKER',
    due_date: '2026-08-20',
    content_revision: 1,
    version: 1,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  }
}

function stayVerification(
  overrides: Partial<StayVerificationResponse> = {},
): StayVerificationResponse {
  return {
    stay_verification_id: 'SV-1',
    worker_id: 'W-018',
    worker_display_name: '쩐티B',
    source_stay_expiry_date: '2026-08-01',
    verification_status: 'UNKNOWN',
    status_checked_at: null,
    extension_applied_at: null,
    extension_receipt_document_id: null,
    approval_result_document_id: null,
    new_stay_expiry_date: null,
    official_consultation_note: null,
    employment_end_confirmed_at: null,
    recheck_date: null,
    employment_change_candidate_available: false,
    suggested_workflow_id: null,
    version: 0,
    ...overrides,
  }
}

function mockWorkerAndDocuments(
  workerOverrides: Partial<WorkerResponse> = {},
  documents: DocumentItemResponse[] = [],
  tasks: TaskSummaryResponse[] = [],
) {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = String(input)
    if (url.includes('/documents')) {
      return Promise.resolve(
        jsonResponse({ items: documents, page: 0, size: 100, total_elements: documents.length }),
      )
    }
    if (url.includes('/tasks')) {
      return Promise.resolve(
        jsonResponse({ items: tasks, page: 0, size: 20, total_elements: tasks.length }),
      )
    }
    return Promise.resolve(jsonResponse(worker(workerOverrides)))
  })
}

function registeredDocument(
  overrides: Partial<WorkerDocumentResponse> = {},
): WorkerDocumentResponse {
  return {
    worker_document_id: 'D-2',
    worker_id: 'W-018',
    document_type: 'PASSPORT_COPY',
    submission_status: 'SUBMITTED',
    source: 'HR_UPLOAD',
    expiry_date: null,
    destination: null,
    note: null,
    file_id: null,
    created_at: '2026-08-03T00:00:00Z',
    updated_at: '2026-08-03T00:00:00Z',
    version: 0,
    ...overrides,
  }
}

function mockWorkerError(status: number, code: string, message: string) {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = String(input)
    if (url.includes('/documents')) {
      return Promise.resolve(jsonResponse({ items: [], page: 0, size: 100, total_elements: 0 }))
    }
    if (url.includes('/tasks')) {
      return Promise.resolve(jsonResponse({ items: [], page: 0, size: 20, total_elements: 0 }))
    }
    return Promise.resolve(errorResponse(status, code, message))
  })
}

function renderPage(workerId: string) {
  render(
    <MemoryRouter initialEntries={[`/workers/${workerId}/detail`]}>
      <Routes>
        <Route path="/workers/:workerId/detail" element={<WorkerDetailPage />} />
        <Route path="/workers/:workerId" element={<p>근로자 목록</p>} />
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

describe('WorkerDetailPage', () => {
  it('renders basic profile info for the selected worker', async () => {
    mockWorkerAndDocuments({
      visa_type: 'E-9',
      employment_permit_end_date: '2028-03-01',
      employment_activity_end_date: '2028-04-01',
    })
    renderPage('W-018')

    expect(await screen.findByRole('heading', { name: '쩐티B' })).toBeInTheDocument()
    expect(screen.getByText('VN')).toBeInTheDocument()
    expect(screen.getAllByText('E-9').length).toBeGreaterThan(0)
    expect(screen.getByText(/2028\.03\.01/)).toBeInTheDocument()
    expect(screen.getByText(/2028\.04\.01/)).toBeInTheDocument()
    expect(screen.getAllByText('준비 중').length).toBeGreaterThan(0)
  })

  it("shows the worker's real documents", async () => {
    mockWorkerAndDocuments({ display_name: '쩐티B' }, [document()])
    renderPage('W-018')

    expect(await screen.findByText('근로계약서')).toBeInTheDocument()
    expect(screen.getByText('승인 대기')).toBeInTheDocument()
  })

  it('shows an empty state when the worker has no documents', async () => {
    mockWorkerAndDocuments({ display_name: '이름없음' }, [])
    renderPage('W-999')

    expect(await screen.findByText('제출된 서류가 없습니다')).toBeInTheDocument()
  })

  it("shows the worker's real current tasks with a link to each task", async () => {
    mockWorkerAndDocuments({ display_name: '쩐티B' }, [], [task()])
    renderPage('W-018')

    const taskLink = await screen.findByRole('link', { name: /여권 사본 요청/ })
    expect(taskLink).toHaveAttribute('href', '/tasks/T-1')
    expect(screen.getByText('근로자 응답 대기')).toBeInTheDocument()
    expect(screen.getByText('~2026-08-20')).toBeInTheDocument()
  })

  it('shows an empty state when the worker has no current tasks', async () => {
    mockWorkerAndDocuments({ display_name: '쩐티B' }, [], [])
    renderPage('W-018')

    expect(await screen.findByText('진행 중인 업무가 없습니다')).toBeInTheDocument()
  })

  it('opens the urgent verification flow without declaring a legal status', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.includes('/stay-verifications')) {
        return Promise.resolve(jsonResponse([stayVerification()]))
      }
      if (url.includes('/documents')) {
        return Promise.resolve(jsonResponse({ items: [], page: 0, size: 100, total_elements: 0 }))
      }
      if (url.includes('/tasks')) {
        return Promise.resolve(jsonResponse({ items: [], page: 0, size: 20, total_elements: 0 }))
      }
      return Promise.resolve(jsonResponse(worker({ stay_expiry_date: '2026-08-01' })))
    })
    renderPage('W-018')

    expect(await screen.findByText(/기록상 D\+/)).toHaveTextContent('긴급 확인')
    await user.click(screen.getByRole('button', { name: '체류상태 확인 시작' }))

    expect(await screen.findByRole('dialog', { name: '체류상태 긴급 확인' })).toBeInTheDocument()
    expect(
      screen.getByText(/법적 체류 상태나 퇴사 여부를 자동으로 확정하지 않습니다/),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '운영 목록에서 안전 보관' }),
    ).not.toBeInTheDocument()
  })

  it('requires an approval document and saves the approved expiry date', async () => {
    const user = userEvent.setup()
    const bodies: Record<string, unknown>[] = []
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url.includes('/stay-verifications/SV-1') && method === 'PATCH') {
        bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>)
        return Promise.resolve(
          jsonResponse(
            stayVerification({
              verification_status: 'APPROVED',
              approval_result_document_id: 'D-1',
              new_stay_expiry_date: '2027-08-01',
              version: 1,
            }),
          ),
        )
      }
      if (url.includes('/stay-verifications')) {
        return Promise.resolve(jsonResponse([stayVerification()]))
      }
      if (url.includes('/documents')) {
        return Promise.resolve(
          jsonResponse({ items: [document()], page: 0, size: 100, total_elements: 1 }),
        )
      }
      if (url.includes('/tasks')) {
        return Promise.resolve(jsonResponse({ items: [], page: 0, size: 20, total_elements: 0 }))
      }
      return Promise.resolve(jsonResponse(worker({ stay_expiry_date: '2026-08-01' })))
    })
    renderPage('W-018')

    await user.click(await screen.findByRole('button', { name: '체류상태 확인 시작' }))
    await screen.findByRole('dialog', { name: '체류상태 긴급 확인' })
    await user.click(screen.getByRole('radio', { name: '연장 승인 완료' }))

    const save = screen.getByRole('button', { name: '확인 결과 저장' })
    expect(save).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('승인 결과 증빙'), 'D-1')
    await user.type(screen.getByLabelText('승인된 새 체류 만료일'), '2027-08-01')
    await user.click(save)

    expect(await screen.findByText('확인 결과와 근거를 저장했습니다.')).toBeInTheDocument()
    expect(bodies).toContainEqual({
      status: 'APPROVED',
      expected_version: 0,
      new_stay_expiry_date: '2027-08-01',
      approval_result_document_id: 'D-1',
    })
  })

  it('shows archive blockers only after HR confirms employment ended', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url.includes('/stay-verifications/SV-1') && method === 'PATCH') {
        return Promise.resolve(
          jsonResponse(
            stayVerification({
              verification_status: 'EMPLOYMENT_ENDED',
              official_consultation_note: 'HR이 출국 사실 확인',
              employment_end_confirmed_at: '2026-08-17T03:00:00Z',
              employment_change_candidate_available: true,
              suggested_workflow_id: 'WF-CHG-001',
              version: 1,
            }),
          ),
        )
      }
      if (url.includes('/archive-eligibility')) {
        return Promise.resolve(
          jsonResponse({
            worker_id: 'W-018',
            archivable: false,
            blockers: ['ACTIVE_EMPLOYMENT_STATUS'],
            worker_version: 1,
          }),
        )
      }
      if (url.includes('/stay-verifications')) {
        return Promise.resolve(jsonResponse([stayVerification()]))
      }
      if (url.includes('/documents')) {
        return Promise.resolve(jsonResponse({ items: [], page: 0, size: 100, total_elements: 0 }))
      }
      if (url.includes('/tasks')) {
        return Promise.resolve(jsonResponse({ items: [], page: 0, size: 20, total_elements: 0 }))
      }
      return Promise.resolve(jsonResponse(worker({ stay_expiry_date: '2026-08-01' })))
    })
    renderPage('W-018')

    await user.click(await screen.findByRole('button', { name: '체류상태 확인 시작' }))
    await user.click(await screen.findByRole('radio', { name: '출국 또는 고용 종료 확인' }))
    expect(screen.queryByText('운영 목록 안전 보관')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('확인 메모 (필수)'), 'HR이 출국 사실 확인')
    await user.click(screen.getByRole('button', { name: '확인 결과 저장' }))

    expect(await screen.findByText('운영 목록 안전 보관')).toBeInTheDocument()
    expect(screen.getByText('근무상태가 아직 재직 또는 휴직입니다.')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '운영 목록에서 안전 보관' }),
    ).not.toBeInTheDocument()
  })

  it('shows a loading state', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    renderPage('W-018')

    expect(screen.getByText('근로자 정보를 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an error state with a retry action', async () => {
    mockWorkerError(404, 'RESOURCE_NOT_FOUND', 'raw')
    renderPage('does-not-exist')

    expect(await screen.findByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })

  it('registers a new document without a file and refreshes the list', async () => {
    const user = userEvent.setup()
    let documentsGetCount = 0
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url.includes('/documents') && method === 'GET') {
        documentsGetCount += 1
        const items =
          documentsGetCount === 1
            ? []
            : [
                document({
                  worker_document_id: 'D-2',
                  document_type: 'PASSPORT_COPY',
                  expiry_date: null,
                }),
              ]
        return Promise.resolve(
          jsonResponse({ items, page: 0, size: 100, total_elements: items.length }),
        )
      }
      if (url.includes('/documents') && method === 'POST') {
        return Promise.resolve(jsonResponse(registeredDocument(), { status: 201 }))
      }
      return Promise.resolve(jsonResponse(worker()))
    })
    renderPage('W-018')
    await screen.findByRole('heading', { name: '쩐티B' })

    await user.click(screen.getByRole('button', { name: '＋ 서류 등록' }))
    expect(screen.getByRole('dialog', { name: '서류 등록' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('여권 사본')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: '서류 등록' })).not.toBeInTheDocument()
  })

  it('uploads a file, registers the document, and attaches the file via patch', async () => {
    const user = userEvent.setup()
    const calls: { url: string; method: string }[] = []
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      calls.push({ url, method })
      if (url.includes('/documents') && method === 'GET') {
        return Promise.resolve(jsonResponse({ items: [], page: 0, size: 100, total_elements: 0 }))
      }
      if (url.includes('/files') && method === 'POST') {
        return Promise.resolve(
          jsonResponse(
            {
              file_id: 'file-1',
              name: 'passport.png',
              mime_type: 'image/png',
              size: 1024,
              scan_status: 'NOT_SCANNED',
            },
            { status: 201 },
          ),
        )
      }
      if (url.includes('/documents') && method === 'POST') {
        return Promise.resolve(jsonResponse(registeredDocument(), { status: 201 }))
      }
      if (url.includes('/documents/') && method === 'PATCH') {
        return Promise.resolve(jsonResponse(registeredDocument({ file_id: 'file-1', version: 1 })))
      }
      return Promise.resolve(jsonResponse(worker()))
    })
    renderPage('W-018')
    await screen.findByRole('heading', { name: '쩐티B' })

    await user.click(screen.getByRole('button', { name: '＋ 서류 등록' }))
    const file = new File(['x'], 'passport.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('서류 파일 선택'), file)
    await user.click(screen.getByRole('button', { name: '등록' }))

    await screen.findByText('제출된 서류가 없습니다')

    expect(calls.some((c) => c.url.includes('/files') && c.method === 'POST')).toBe(true)
    expect(
      calls.some((c) => c.url.includes('/workers/W-018/documents') && c.method === 'POST'),
    ).toBe(true)
    expect(calls.some((c) => c.url.includes('/documents/D-2') && c.method === 'PATCH')).toBe(true)
  })

  it('edits worker info and refreshes the detail panel', async () => {
    const user = userEvent.setup()
    const calls: { url: string; method: string; body: string | undefined }[] = []
    let workerGetCount = 0
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      calls.push({ url, method, body: init?.body as string | undefined })
      if (url.includes('/documents')) {
        return Promise.resolve(jsonResponse({ items: [], page: 0, size: 100, total_elements: 0 }))
      }
      if (url.includes('/workers/W-018') && method === 'PATCH') {
        return Promise.resolve(jsonResponse(worker({ display_name: '쩐티B(수정)', version: 2 })))
      }
      workerGetCount += 1
      return Promise.resolve(
        jsonResponse(
          worker(workerGetCount === 1 ? {} : { display_name: '쩐티B(수정)', version: 2 }),
        ),
      )
    })
    renderPage('W-018')
    await screen.findByRole('heading', { name: '쩐티B' })

    await user.click(screen.getByRole('button', { name: '정보 수정' }))
    expect(screen.getByRole('dialog', { name: '근로자 정보 수정' })).toBeInTheDocument()

    const nameInput = screen.getByDisplayValue('쩐티B')
    await user.clear(nameInput)
    await user.type(nameInput, '쩐티B(수정)')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByRole('heading', { name: '쩐티B(수정)' })).toBeInTheDocument()
    const patchCall = calls.find((c) => c.url.includes('/workers/W-018') && c.method === 'PATCH')
    expect(patchCall).toBeDefined()
    expect(JSON.parse(patchCall!.body!)).toMatchObject({
      display_name: '쩐티B(수정)',
      expected_version: 1,
    })
  })

  it('does not report success when an existing employment date is cleared', async () => {
    const user = userEvent.setup()
    mockWorkerAndDocuments({ employment_permit_end_date: '2028-03-01' })
    renderPage('W-018')
    await screen.findByRole('heading', { name: '쩐티B' })

    await user.click(screen.getByRole('button', { name: '정보 수정' }))
    await user.clear(screen.getByLabelText('고용허가 종료일'))
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(
      screen.getByText(
        '등록된 비자·날짜 값의 삭제는 아직 지원하지 않습니다. 기존 값을 유지해 주세요.',
      ),
    ).toBeInTheDocument()
    expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false)
  })
})
