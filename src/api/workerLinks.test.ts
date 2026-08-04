import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchWorkerLink,
  issueWorkerLink,
  resolveWorkerPortalUrl,
  submitWorkerResponse,
  uploadWorkerLinkDocument,
} from './workerLinks'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
afterEach(() => vi.unstubAllGlobals())

describe('worker link APIs', () => {
  it('uses the authenticated issue endpoint with an idempotency key', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ worker_url: 'raw-token', expires_at: '2026-08-07T00:00:00Z' }, 201))
    await issueWorkerLink('T-1', { expires_in_hours: 72, rotate_existing: true }, 'issue-1')

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/tasks/T-1/worker-link')
    expect(new Headers(init?.headers).get('Idempotency-Key')).toBe('issue-1')
  })

  it('views, uploads and submits through the public token endpoints', async () => {
    vi.mocked(fetch).mockImplementation(() => Promise.resolve(jsonResponse({ upload_id: 'U-1' }, 201)))

    await fetchWorkerLink('token value')
    await uploadWorkerLinkDocument('token value', new File(['passport'], 'passport.jpg', { type: 'image/jpeg' }), 'upload-1')
    await submitWorkerResponse('token value', {
      response_type: 'DOCUMENT_SUBMITTED', upload_ids: ['U-1'], idempotency_key: 'response-1',
    })

    const calls = vi.mocked(fetch).mock.calls
    expect(String(calls[0][0])).toContain('/public/worker-links/token%20value')
    expect(String(calls[1][0])).toContain('/documents')
    expect(calls[1][1]?.body).toBeInstanceOf(FormData)
    expect(String(calls[2][0])).toContain('/responses')
  })

  it('turns the current backend raw-token response into a frontend route', () => {
    expect(resolveWorkerPortalUrl('raw/token', 'https://fowoco.kr')).toBe(
      'https://fowoco.kr/worker-portal/raw%2Ftoken',
    )
    expect(resolveWorkerPortalUrl('https://worker.fowoco.kr/s/token', 'https://fowoco.kr')).toBe(
      'https://worker.fowoco.kr/s/token',
    )
  })
})
