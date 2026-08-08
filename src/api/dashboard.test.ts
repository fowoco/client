import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchDashboardToday } from './dashboard'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          summary_counts: {
            pending_approval: 1,
            due_today: 2,
            needs_info: 3,
            worker_response: 4,
          },
          priority_tasks: [],
          upcoming_7_days: [],
          recommendations: {
            connected_count: 0,
            prepared: [],
            review: [],
            after_approval: [],
          },
          approval_count: 1,
          worker_response_count: 4,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    ),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('fetchDashboardToday', () => {
  it('requests the Today projection with the selected timezone', async () => {
    await fetchDashboardToday('Asia/Seoul')

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/dashboard/today?timezone=Asia%2FSeoul')
    expect(init?.method).toBeUndefined()
  })
})
