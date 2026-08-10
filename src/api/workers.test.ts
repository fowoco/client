import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchWorkerById, fetchWorkers, patchWorker, registerWorker } from './workers'

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

describe('worker E-9 fields', () => {
  it('sends visa and employment dates when registering a worker', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ worker_id: 'W-2' }))

    await registerWorker({
      display_name: '응웬반A',
      visa_type: 'E-9',
      employment_permit_end_date: '2028-03-01',
      employment_activity_end_date: '2028-03-01',
    })

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect(JSON.parse(init?.body as string)).toEqual({
      display_name: '응웬반A',
      visa_type: 'E-9',
      employment_permit_end_date: '2028-03-01',
      employment_activity_end_date: '2028-03-01',
    })
  })

  it('keeps expected_version when patching employment dates', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ worker_id: 'W-2' }))

    await patchWorker('W-2', {
      employment_permit_end_date: '2028-04-01',
      expected_version: 3,
    })

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/workers/W-2')
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(init?.body as string)).toEqual({
      employment_permit_end_date: '2028-04-01',
      expected_version: 3,
    })
  })
})
