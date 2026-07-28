import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchAuditEvents, fetchTaskActivities } from './audit'

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchTaskActivities', () => {
  it('requests /tasks/{id}/activities', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]))

    await fetchTaskActivities('T-1')

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/tasks/T-1/activities')
  })
})

describe('fetchAuditEvents', () => {
  it('requests /audit-events with a default limit and no other params', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ items: [], next_cursor: null }))

    await fetchAuditEvents()

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/audit-events?limit=50')
  })

  it('adds filters when given', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ items: [], next_cursor: null }))

    await fetchAuditEvents({
      actorType: 'AI_AGENT',
      createdFrom: '2026-07-01T00:00:00Z',
      limit: 100,
    })

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('actor_type=AI_AGENT')
    expect(url).toContain('created_from=2026-07-01T00%3A00%3A00Z')
    expect(url).toContain('limit=100')
  })
})
