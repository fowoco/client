import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DocumentItemResponse, DocumentPageResponse } from '../../api/documents'
import { DocumentListPage } from './DocumentListPage'

function document(overrides: Partial<DocumentItemResponse>): DocumentItemResponse {
  return {
    worker_document_id: 'D-1',
    worker_id: 'W-1',
    display_name: '수라즈C',
    document_type: 'ARC',
    submission_status: 'MISSING',
    expiry_date: null,
    file_id: null,
    ...overrides,
  }
}

const DOCUMENTS: DocumentItemResponse[] = [
  document({ worker_document_id: 'D-1', display_name: '수라즈C', document_type: 'ARC', submission_status: 'MISSING' }),
  document({
    worker_document_id: 'D-2',
    display_name: '쩐티B',
    document_type: 'CONTRACT',
    submission_status: 'SUBMITTED',
    expiry_date: '2027-07-18',
  }),
  document({
    worker_document_id: 'D-3',
    display_name: '박서준',
    document_type: 'PERMIT',
    submission_status: 'VERIFIED',
    expiry_date: '2027-07-10',
  }),
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

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/documents']}>
      <Routes>
        <Route path="/documents" element={<DocumentListPage />} />
        <Route path="/documents/:documentId" element={<p>서류 상세</p>} />
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

describe('DocumentListPage', () => {
  it('renders every tab and document row', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(DOCUMENTS)))
    renderPage()

    expect(await screen.findByText('수라즈C')).toBeInTheDocument()
    expect(screen.getByText('쩐티B')).toBeInTheDocument()
    expect(screen.getByText('박서준')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '전체 3' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '미제출 1' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '확인 대기 1' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '확인 완료 1' })).toBeInTheDocument()
  })

  it('filters documents by search query', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(DOCUMENTS)))
    renderPage()

    await screen.findByLabelText('서류 검색')
    await user.type(screen.getByLabelText('서류 검색'), '근로계약서')

    await waitFor(() => {
      expect(screen.queryByText('수라즈C')).not.toBeInTheDocument()
    })
    expect(screen.getByText('쩐티B')).toBeInTheDocument()
  })

  it('filters documents by tab', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(DOCUMENTS)))
    renderPage()

    await user.click(await screen.findByRole('tab', { name: '미제출 1' }))

    expect(screen.getByText('수라즈C')).toBeInTheDocument()
    expect(screen.queryByText('박서준')).not.toBeInTheDocument()
  })

  it('navigates to the document detail when "확인하기 →" is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(DOCUMENTS)))
    renderPage()

    await user.click((await screen.findAllByRole('button', { name: '확인하기 →' }))[0])

    expect(await screen.findByText('서류 상세')).toBeInTheDocument()
  })

  it('shows an empty state when a search has no matches', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(DOCUMENTS)))
    renderPage()

    await screen.findByLabelText('서류 검색')
    await user.type(screen.getByLabelText('서류 검색'), '존재하지않는검색어')

    expect(await screen.findByText('검색 결과가 없습니다')).toBeInTheDocument()
  })

  it('shows a loading state', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('서류 목록을 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an error state with a retry action', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(500, 'INTERNAL_SERVER_ERROR', 'raw'))
    renderPage()

    expect(await screen.findByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })

  it('shows an empty state when there are no documents', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse([])))
    renderPage()

    expect(await screen.findByText('등록된 서류가 없습니다')).toBeInTheDocument()
  })

  it('opens the HWP/HWPX upload modal', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(pageResponse(DOCUMENTS)))
    renderPage()
    await screen.findByText('수라즈C')

    await user.click(screen.getByRole('button', { name: '＋ HWP/HWPX 업로드' }))

    expect(screen.getByRole('dialog', { name: 'HWP/HWPX 문서 업로드' })).toBeInTheDocument()
  })
})
