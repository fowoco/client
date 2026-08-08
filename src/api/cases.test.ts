import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCaseProjection, fetchCases } from './cases'

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
afterEach(() => vi.unstubAllGlobals())

describe('case APIs', () => {
  it('lists Cases with query parameters and fetches a projection by encoded ID', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(jsonResponse({ items: [], page: 0, size: 20, total_elements: 0 })),
    )

    await fetchCases({ keyword: '응웬 반', page: 1, size: 20 })
    await fetchCaseProjection('C/1')

    const calls = vi.mocked(fetch).mock.calls
    expect(String(calls[0][0])).toContain('/cases?keyword=%EC%9D%91%EC%9B%AC+%EB%B0%98&page=1&size=20')
    expect(String(calls[1][0])).toContain('/cases/C%2F1/projection')
  })
})
