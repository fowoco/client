import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, getAccessToken, setAccessToken, setAuthExpiredHandler } from './client'
import { ApiError } from './errors'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function errorBody(overrides: Partial<{ status: number; code: string; message: string }> = {}) {
  return {
    timestamp: '2026-07-22T01:23:45Z',
    status: overrides.status ?? 404,
    code: overrides.code ?? 'RESOURCE_NOT_FOUND',
    message: overrides.message ?? '요청한 정보를 찾을 수 없습니다.',
    path: '/api/v1/workers/1',
    request_id: 'req-1',
    field_errors: [],
  }
}

beforeEach(() => {
  setAccessToken(null)
  setAuthExpiredHandler(null)
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiFetch', () => {
  it('returns parsed JSON on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ id: '1' }))

    const result = await apiFetch<{ id: string }>('/workers/1')

    expect(result).toEqual({ id: '1' })
  })

  it('sends the Authorization header when an access token is set', async () => {
    setAccessToken('token-abc')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ok: true }))

    await apiFetch('/workers')

    const [, init] = vi.mocked(fetch).mock.calls[0]
    const headers = init!.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer token-abc')
  })

  it('returns undefined for 204 No Content', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }))

    const result = await apiFetch('/auth/logout', { method: 'POST' })

    expect(result).toBeUndefined()
  })

  it('throws an ApiError parsed from the response body on failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(errorBody(), { status: 404 }))

    await expect(apiFetch('/workers/1')).rejects.toMatchObject({
      status: 404,
      code: 'RESOURCE_NOT_FOUND',
    })
  })

  it('throws a NETWORK_ERROR ApiError when fetch itself rejects', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(apiFetch('/workers')).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
  })

  it('refreshes the access token once on 401 and retries the original request', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(errorBody({ status: 401, code: 'AUTHENTICATION_REQUIRED' }), { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'new-token' }))
      .mockResolvedValueOnce(jsonResponse({ id: '1' }))

    const result = await apiFetch<{ id: string }>('/workers/1')

    expect(result).toEqual({ id: '1' })
    expect(getAccessToken()).toBe('new-token')
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(vi.mocked(fetch).mock.calls[1][0]).toContain('/auth/refresh')
  })

  it('clears the token and calls the auth-expired handler when refresh fails', async () => {
    const onExpired = vi.fn()
    setAuthExpiredHandler(onExpired)
    setAccessToken('stale-token')

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(errorBody({ status: 401, code: 'AUTHENTICATION_REQUIRED' }), { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))

    await expect(apiFetch('/workers/1')).rejects.toBeInstanceOf(ApiError)

    expect(getAccessToken()).toBeNull()
    expect(onExpired).toHaveBeenCalledTimes(1)
  })

  it('does not attempt refresh when skipAuthRetry is set', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(errorBody({ status: 401, code: 'INVALID_CREDENTIALS' }), { status: 401 }),
    )

    await expect(apiFetch('/auth/login', { skipAuthRetry: true })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('single-flights concurrent refresh calls', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(errorBody({ status: 401 }), { status: 401 }))
      .mockResolvedValueOnce(jsonResponse(errorBody({ status: 401 }), { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'new-token' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'a' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'b' }))

    const [a, b] = await Promise.all([
      apiFetch<{ id: string }>('/workers/a'),
      apiFetch<{ id: string }>('/workers/b'),
    ])

    expect(a).toEqual({ id: 'a' })
    expect(b).toEqual({ id: 'b' })
    const refreshCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([url]) => String(url).includes('/auth/refresh'))
    expect(refreshCalls).toHaveLength(1)
  })
})
