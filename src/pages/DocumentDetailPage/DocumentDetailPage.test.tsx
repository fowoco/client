import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DocumentItemResponse, DocumentPageResponse } from '../../api/documents'
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

const DOCUMENTS: DocumentItemResponse[] = [
  document({ worker_document_id: 'D-1', worker_id: 'W-1', display_name: '응웬반A' }),
  document({ worker_document_id: 'D-2', worker_id: 'W-2', display_name: '박서준', document_type: 'PERMIT' }),
]

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' }, ...init })
}

function errorResponse(status: number, code: string, message: string) {
  return jsonResponse(
    { timestamp: '2026-07-27T01:23:45Z', status, code, message, path: '/api/v1/documents', request_id: 'req-1', field_errors: [] },
    { status },
  )
}

function pageResponse(items: DocumentItemResponse[]): DocumentPageResponse {
  return { items, page: 0, size: 100, total_elements: items.length }
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
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('DocumentDetailPage', () => {
  it('renders the document type and worker name', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(DOCUMENTS)))
    renderPage('D-1')

    expect(await screen.findByRole('heading', { name: '외국인등록증' })).toBeInTheDocument()
    expect(screen.getAllByText(/응웬반A/).length).toBeGreaterThan(0)
  })

  it('navigates to the related worker', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(DOCUMENTS)))
    renderPage('D-1')

    await user.click(await screen.findByRole('button', { name: '응웬반A 정보 →' }))

    expect(await screen.findByText('근로자 상세')).toBeInTheDocument()
  })

  it('downloads the attached original file through the authenticated file API', async () => {
    const user = userEvent.setup()
    const fileDocuments = [
      document({
        worker_document_id: 'D-1',
        display_name: '응웬반A',
        submission_status: 'SUBMITTED',
        file_id: 'file-1',
      }),
    ]
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(pageResponse(fileDocuments)))
      .mockResolvedValueOnce(
        new Response(new Blob(['pdf']), {
          headers: { 'Content-Disposition': 'attachment; filename="arc.pdf"' },
        }),
      )
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:file-1')
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickAnchor = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    renderPage('D-1')

    await user.click(await screen.findByRole('button', { name: '원본 다운로드' }))

    expect(createObjectUrl).toHaveBeenCalledTimes(1)
    expect(clickAnchor).toHaveBeenCalledTimes(1)
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:file-1')
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain('/files/file-1/content')
  })

  it('shows an empty state when the documentId does not match any document', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(DOCUMENTS)))
    renderPage('does-not-exist')

    expect(await screen.findByText('서류를 찾을 수 없습니다')).toBeInTheDocument()
  })

  it('does not fabricate approval or rejection without a versioned API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(DOCUMENTS)))
    renderPage('D-1')
    await screen.findByRole('heading', { name: '외국인등록증' })

    expect(screen.getByText('서류 없음')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '반려' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '상세 확인' })).toBeDisabled()
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
