import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchWorkerById, fetchWorkers } from './workers'

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchWorkers', () => {
  it('requests /workers with default pagination and no search param', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ items: [], page: 0, size: 100, total_elements: 0 }))

    await fetchWorkers()

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/workers?page=0&size=100')
  })

  it('adds status/language/expiryBefore filters when given', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ items: [], page: 0, size: 20, total_elements: 0 }))

    await fetchWorkers({ status: 'ACTIVE', language: 'vi', expiryBefore: '2026-08-01', page: 1, size: 20 })

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('status=ACTIVE')
    expect(url).toContain('language=vi')
    expect(url).toContain('expiryBefore=2026-08-01')
    expect(url).toContain('page=1&size=20')
  })
})

describe('fetchWorkerById', () => {
  it('requests /workers/{id}', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ worker_id: 'W-1' }))

    await fetchWorkerById('W-1')

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/workers/W-1')
  })
})
