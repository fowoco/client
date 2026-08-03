import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchDocuments, patchWorkerDocument, registerWorkerDocument } from './documents'

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchDocuments', () => {
  it('requests /documents with default pagination and no filters', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ items: [], page: 0, size: 100, total_elements: 0 }))

    await fetchDocuments()

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/documents?page=0&size=100')
  })

  it('adds filters when given', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ items: [], page: 0, size: 20, total_elements: 0 }))

    await fetchDocuments({ workerId: 'W-1', documentType: 'PASSPORT_COPY', status: 'MISSING', page: 1, size: 20 })

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('workerId=W-1')
    expect(url).toContain('documentType=PASSPORT_COPY')
    expect(url).toContain('status=MISSING')
    expect(url).toContain('page=1&size=20')
  })
})

describe('registerWorkerDocument', () => {
  it('POSTs to /workers/{id}/documents', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        worker_document_id: 'doc-1',
        worker_id: 'W-1',
        document_type: 'PASSPORT_COPY',
        submission_status: 'SUBMITTED',
        expiry_date: null,
        destination: null,
        note: null,
        file_id: null,
        created_at: '2026-08-03T00:00:00Z',
        updated_at: '2026-08-03T00:00:00Z',
        version: 0,
      }),
    )

    await registerWorkerDocument('W-1', { document_type: 'PASSPORT_COPY', submission_status: 'SUBMITTED' })

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/workers/W-1/documents')
    expect(init?.method).toBe('POST')
  })
})

describe('patchWorkerDocument', () => {
  it('PATCHes /workers/{id}/documents/{id} with expected_version', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        worker_document_id: 'doc-1',
        worker_id: 'W-1',
        document_type: 'PASSPORT_COPY',
        submission_status: 'SUBMITTED',
        expiry_date: null,
        destination: null,
        note: null,
        file_id: 'file-1',
        created_at: '2026-08-03T00:00:00Z',
        updated_at: '2026-08-03T00:00:00Z',
        version: 1,
      }),
    )

    await patchWorkerDocument('W-1', 'doc-1', { file_id: 'file-1', expected_version: 0 })

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/workers/W-1/documents/doc-1')
    expect(init?.method).toBe('PATCH')
  })
})
