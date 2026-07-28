import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchWorkflowCatalog } from './workflows'

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchWorkflowCatalog', () => {
  it('requests /workflow-catalogs', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        bundle_id: 'b-1',
        bundle_version: '1',
        bundle_status: 'ACTIVE',
        source_repository: 'fowoco/knowledge',
        generated_at: '2026-07-01T00:00:00Z',
        workflows: [],
      }),
    )

    await fetchWorkflowCatalog()

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/workflow-catalogs')
  })
})
