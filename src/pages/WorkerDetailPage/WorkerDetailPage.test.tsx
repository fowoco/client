import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DocumentItemResponse, WorkerDocumentResponse } from '../../api/documents'
import type { WorkerResponse } from '../../api/workers'
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
    { timestamp: '2026-07-27T01:23:45Z', status, code, message, path: '/api/v1/workers/W-1', request_id: 'req-1', field_errors: [] },
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
    stay_expiry_date: null,
    contract_start_date: null,
    contract_end_date: null,
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
    expiry_date: '2027-07-18',
    file_id: 'F-1',
    ...overrides,
  }
}

function mockWorkerAndDocuments(workerOverrides: Partial<WorkerResponse> = {}, documents: DocumentItemResponse[] = []) {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = String(input)
    if (url.includes('/documents')) {
      return Promise.resolve(jsonResponse({ items: documents, page: 0, size: 100, total_elements: documents.length }))
    }
    return Promise.resolve(jsonResponse(worker(workerOverrides)))
  })
}

function registeredDocument(overrides: Partial<WorkerDocumentResponse> = {}): WorkerDocumentResponse {
  return {
    worker_document_id: 'D-2',
    worker_id: 'W-018',
    document_type: 'PASSPORT_COPY',
    submission_status: 'SUBMITTED',
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
    mockWorkerAndDocuments()
    renderPage('W-018')

    expect(await screen.findByRole('heading', { name: '쩐티B' })).toBeInTheDocument()
    expect(screen.getByText('VN')).toBeInTheDocument()
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
        const items = documentsGetCount === 1 ? [] : [document({ worker_document_id: 'D-2', document_type: 'PASSPORT_COPY', expiry_date: null })]
        return Promise.resolve(jsonResponse({ items, page: 0, size: 100, total_elements: items.length }))
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
            { file_id: 'file-1', name: 'passport.png', mime_type: 'image/png', size: 1024, scan_status: 'NOT_SCANNED' },
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
    expect(calls.some((c) => c.url.includes('/workers/W-018/documents') && c.method === 'POST')).toBe(true)
    expect(calls.some((c) => c.url.includes('/documents/D-2') && c.method === 'PATCH')).toBe(true)
  })
})
