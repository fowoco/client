import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchNotifications, markNotificationRead } from './notifications'

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => vi.unstubAllGlobals())

describe('notification API', () => {
  it('requests the notification page with optional filters', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ items: [], unread_count: 0, has_next: false, next_cursor: null }),
    )

    await fetchNotifications({
      unreadOnly: true,
      cursor: '2026-08-10T01:02:03Z',
      size: 10,
    })

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/notifications?')
    expect(String(url)).toContain('unreadOnly=true')
    expect(String(url)).toContain('cursor=2026-08-10T01%3A02%3A03Z')
    expect(String(url)).toContain('size=10')
  })

  it('marks the selected notification as read', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }))

    await markNotificationRead('notification/id')

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/notifications/notification%2Fid/read')
    expect(init?.method).toBe('POST')
  })
})
