import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { subscribeAiRunEvents, type AiRunPublicEvent } from './aiRunEvents'
import { setAccessToken } from './client'

const EVENT: AiRunPublicEvent = {
  event_id: 2,
  ai_run_id: 'A-1',
  type: 'RUN_STARTED',
  status: 'RUNNING',
  analysis_outcome: null,
  attempt_count: 1,
  version: 2,
  occurred_at: '2026-08-09T00:00:00Z',
}

function eventStream(chunks: string[]) {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
      controller.close()
    },
  })
}

beforeEach(() => {
  setAccessToken('access-token')
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  setAccessToken(null)
  vi.unstubAllGlobals()
})

describe('subscribeAiRunEvents', () => {
  it('uses fetch with bearer auth and parses SSE split across response chunks', async () => {
    const payload = JSON.stringify(EVENT)
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        eventStream([
          ':heartbeat\n\nid:2\nevent:RUN_STARTED\ndata:',
          `${payload.slice(0, 25)}`,
          `${payload.slice(25)}\n\n`,
        ]),
        { status: 200, headers: { 'Content-Type': 'text/event-stream;charset=UTF-8' } },
      ),
    )
    const onEvent = vi.fn()

    await subscribeAiRunEvents('A/1', { lastEventId: '1', onEvent })

    expect(onEvent).toHaveBeenCalledWith(EVENT)
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(String(url)).toContain('/ai-runs/A%2F1/events')
    expect(headers.get('Accept')).toBe('text/event-stream')
    expect(headers.get('Authorization')).toBe('Bearer access-token')
    expect(headers.get('Last-Event-ID')).toBe('1')
  })

  it('rejects a non-stream response so the caller can fall back to polling', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 'AI_RUN_SSE_CONNECTION_LIMIT' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(subscribeAiRunEvents('A-1', { onEvent: vi.fn() })).rejects.toThrow(
      'event stream failed with 429',
    )
  })
})
