import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchDocuments } from './documents'

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
