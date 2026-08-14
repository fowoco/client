import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DocumentDetailResponse, DocumentItemResponse } from '../../api/documents'
import type { DocumentOcrRunResponse } from '../../api/documentOcr'
import { DocumentDetailPage } from './DocumentDetailPage'

function document(overrides: Partial<DocumentItemResponse>): DocumentItemResponse {
  return {
    worker_document_id: 'D-1',
    worker_id: 'W-1',
    display_name: '응웬반A',
    document_type: 'ARC',
    submission_status: 'MISSING',
    expiry_date: null,
    file_id: null,
    ...overrides,
  }
}

function detail(overrides: Partial<DocumentDetailResponse>): DocumentDetailResponse {
  return {
    ...document(overrides),
    task_id: null,
    version: 0,
    file_name: null,
    file_mime_type: null,
    file_size: null,
    file_scan_status: null,
    ...overrides,
  }
}

const DOCUMENTS: DocumentItemResponse[] = [
  document({ worker_document_id: 'D-1', worker_id: 'W-1', display_name: '응웬반A' }),
  document({
    worker_document_id: 'D-2',
    worker_id: 'W-2',
    display_name: '박서준',
    document_type: 'PERMIT',
  }),
]

function ocrRun(
  status: DocumentOcrRunResponse['status'],
  overrides: Partial<DocumentOcrRunResponse> = {},
): DocumentOcrRunResponse {
  return {
    ocr_run_id: 'ocr-run-1',
    document_id: 'D-1',
    file_id: 'file-1',
    document_type: 'ARC',
    status,
    result: null,
    corrected_fields: {},
    error_code: null,
    reviewed_by: null,
    review_reason: null,
    created_at: '2026-08-09T00:00:00Z',
    started_at: null,
    completed_at: null,
    reviewed_at: null,
    updated_at: '2026-08-09T00:00:00Z',
    version: 0,
    already_requested: false,
    ...overrides,
  }
}

const OCR_READY = ocrRun('READY_FOR_REVIEW', {
  result: {
    matched_template_id: 12,
    document_side: 'FRONT',
    fields: {
      alien_registration_number: '900101-5000000',
      visa_type: 'E-9',
      stay_expiration_date: '2026-12-01',
    },
    field_confidences: {
      alien_registration_number: 0.98,
      visa_type: 0.93,
      stay_expiration_date: 0.81,
    },
    review_reasons: ['체류 만료일을 원본과 대조해 주세요.'],
  },
  completed_at: '2026-08-09T00:00:02Z',
  version: 2,
})

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
      path: '/api/v1/documents',
      request_id: 'req-1',
      field_errors: [],
    },
    { status },
  )
}

function renderPage(documentId: string) {
  render(
    <MemoryRouter initialEntries={[`/documents/${documentId}`]}>
      <Routes>
        <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
        <Route path="/documents" element={<p>서류 목록</p>} />
        <Route path="/workers/:workerId/detail" element={<p>근로자 상세</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('DocumentDetailPage', () => {
  it('renders the document type and worker name', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(detail(DOCUMENTS[0])))
    renderPage('D-1')

    expect(await screen.findByRole('heading', { name: '외국인등록증' })).toBeInTheDocument()
    expect(screen.getAllByText(/응웬반A/).length).toBeGreaterThan(0)
  })

  it('navigates to the related worker', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(detail(DOCUMENTS[0])))
    renderPage('D-1')

    await user.click(await screen.findByRole('button', { name: '응웬반A 정보 →' }))

    expect(await screen.findByText('근로자 상세')).toBeInTheDocument()
  })

  it('downloads the attached original file through the authenticated file API', async () => {
    const user = userEvent.setup()
    const fileDocument = detail({
      worker_document_id: 'D-1',
      display_name: '응웬반A',
      submission_status: 'SUBMITTED',
      file_id: 'file-1',
      file_name: 'arc.pdf',
      file_mime_type: 'application/pdf',
      file_size: 3,
      file_scan_status: 'NOT_SCANNED',
    })
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(fileDocument))
      .mockResolvedValueOnce(
        errorResponse(404, 'DOCUMENT_OCR_RUN_NOT_FOUND', 'OCR 실행 이력을 찾을 수 없습니다.'),
      )
      .mockResolvedValueOnce(
        new Response(new Blob(['pdf']), {
          headers: { 'Content-Disposition': 'attachment; filename="arc.pdf"' },
        }),
      )
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:file-1')
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickAnchor = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderPage('D-1')

    await user.click(await screen.findByRole('button', { name: '원본 다운로드' }))

    expect(createObjectUrl).toHaveBeenCalledTimes(1)
    expect(clickAnchor).toHaveBeenCalledTimes(1)
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:file-1')
    const downloadCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes('/files/file-1/content'))
    expect(downloadCall).toBeDefined()
  })

  it('shows an empty state when the documentId does not match any document', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(404, 'DOCUMENT_NOT_FOUND', 'not found'))
    renderPage('does-not-exist')

    expect(await screen.findByText('서류를 찾을 수 없습니다')).toBeInTheDocument()
  })

  it('does not offer OCR review when no file is connected', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(detail(DOCUMENTS[0])))
    renderPage('D-1')
    await screen.findByRole('heading', { name: '외국인등록증' })

    expect(screen.getByText('서류 없음')).toBeInTheDocument()
    expect(screen.getByText('연결된 파일이 없어 OCR을 실행할 수 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'OCR 검토 완료' })).not.toBeInTheDocument()
  })

  it('runs OCR, polls until ready, submits only HR corrections, and marks review complete', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const fileDocument = detail({
      worker_document_id: 'D-1',
      display_name: '응웬반A',
      submission_status: 'SUBMITTED',
      file_id: 'file-1',
      file_name: 'arc.pdf',
      file_mime_type: 'application/pdf',
      file_size: 3,
      file_scan_status: 'NOT_SCANNED',
    })
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(fileDocument))
      .mockResolvedValueOnce(
        errorResponse(404, 'DOCUMENT_OCR_RUN_NOT_FOUND', 'OCR 실행 이력을 찾을 수 없습니다.'),
      )
      .mockResolvedValueOnce(jsonResponse(ocrRun('QUEUED')))
      .mockResolvedValueOnce(jsonResponse(OCR_READY))
      .mockResolvedValueOnce(
        jsonResponse(
          ocrRun('APPROVED', {
            ...OCR_READY,
            status: 'APPROVED',
            corrected_fields: { stay_expiration_date: '2026-12-31' },
            reviewed_at: '2026-08-09T00:00:04Z',
            version: 3,
          }),
        ),
      )
    renderPage('D-1')

    await user.click(await screen.findByRole('button', { name: 'OCR 실행' }))
    expect(await screen.findByText('OCR 결과를 확인하는 중입니다.')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(1600)
    const expiryInput = await screen.findByDisplayValue('2026-12-01')
    await user.clear(expiryInput)
    await user.type(expiryInput, '2026-12-31')
    await user.click(screen.getByRole('button', { name: 'OCR 검토 완료' }))

    expect(await screen.findByText('OCR 검토를 완료했습니다.')).toBeInTheDocument()
    expect(screen.getByText(/근로자 정보는 자동 변경되지 않습니다/)).toBeInTheDocument()

    const calls = vi.mocked(fetch).mock.calls
    const createCall = calls.find(
      ([url, init]) => String(url).endsWith('/documents/D-1/ocr-runs') && init?.method === 'POST',
    )
    expect(new Headers(createCall?.[1]?.headers).get('Idempotency-Key')).toBeTruthy()
    const reviewCall = calls.find(([url]) => String(url).includes('/ocr-run-1/review'))
    expect(JSON.parse(reviewCall?.[1]?.body as string)).toEqual({
      expected_version: 2,
      decision: 'APPROVE',
      corrected_fields: { stay_expiration_date: '2026-12-31' },
    })
  })

  it('previews an authenticated image and revokes the object URL on unmount', async () => {
    const imageDocument = detail({
      worker_document_id: 'D-1',
      submission_status: 'SUBMITTED',
      file_id: 'file-1',
      file_name: '외국인등록증_앞면.png',
      file_mime_type: 'image/png',
      file_size: 3,
      file_scan_status: 'NOT_SCANNED',
    })
    vi.mocked(fetch).mockImplementation((url) => {
      if (String(url).includes('/files/file-1/content')) {
        return Promise.resolve(new Response(new Blob(['png'], { type: 'image/png' })))
      }
      if (String(url).includes('/ocr-runs/latest')) {
        return Promise.resolve(errorResponse(404, 'DOCUMENT_OCR_RUN_NOT_FOUND', 'not found'))
      }
      return Promise.resolve(jsonResponse(imageDocument))
    })
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview-1')
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const rendered = render(
      <MemoryRouter initialEntries={['/documents/D-1']}>
        <Routes>
          <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('img', { name: '외국인등록증 합성 원본 미리보기' }),
    ).toHaveAttribute('src', 'blob:preview-1')
    expect(createObjectUrl).toHaveBeenCalledTimes(1)

    rendered.unmount()
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:preview-1')
  })

  it('shows a preparing message when the OCR feature returns 503', async () => {
    const fileDocument = detail({
      worker_document_id: 'D-1',
      submission_status: 'SUBMITTED',
      file_id: 'file-1',
      file_name: 'arc.pdf',
      file_mime_type: 'application/pdf',
      file_size: 3,
      file_scan_status: 'NOT_SCANNED',
    })
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(fileDocument))
      .mockResolvedValueOnce(
        errorResponse(503, 'DOCUMENT_OCR_DISABLED', 'OCR 기능이 아직 활성화되지 않았습니다.'),
      )
    renderPage('D-1')

    expect(await screen.findByText(/OCR 기능 준비 중입니다/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'OCR 실행' })).not.toBeInTheDocument()
  })

  it('requires a reason and submits no corrected fields when OCR is rejected', async () => {
    const user = userEvent.setup()
    const fileDocument = detail({
      worker_document_id: 'D-1',
      submission_status: 'SUBMITTED',
      file_id: 'file-1',
      file_name: 'arc.pdf',
      file_mime_type: 'application/pdf',
      file_size: 3,
      file_scan_status: 'NOT_SCANNED',
    })
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(fileDocument))
      .mockResolvedValueOnce(jsonResponse(OCR_READY))
      .mockResolvedValueOnce(
        jsonResponse(
          ocrRun('REJECTED', {
            ...OCR_READY,
            status: 'REJECTED',
            review_reason: '원본 이미지가 흐립니다.',
            reviewed_at: '2026-08-09T00:00:04Z',
            version: 3,
          }),
        ),
      )
    renderPage('D-1')

    const rejectButton = await screen.findByRole('button', { name: '반려' })
    expect(rejectButton).toBeDisabled()
    await user.type(
      screen.getByPlaceholderText('반려할 때만 입력해 주세요.'),
      '원본 이미지가 흐립니다.',
    )
    await user.click(rejectButton)

    expect(await screen.findByText(/OCR 결과를 반려했습니다/)).toBeInTheDocument()
    const reviewCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).includes('/ocr-run-1/review'))
    expect(JSON.parse(reviewCall?.[1]?.body as string)).toEqual({
      expected_version: 2,
      decision: 'REJECT',
      reason: '원본 이미지가 흐립니다.',
      corrected_fields: {},
    })
  })

  it('shows a loading state', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    renderPage('D-1')
    expect(screen.getByText('서류 정보를 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an error state with a retry action', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(500, 'INTERNAL_SERVER_ERROR', 'raw'))
    renderPage('D-1')

    expect(await screen.findByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })
})
