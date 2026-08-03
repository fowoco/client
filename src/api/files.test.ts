import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { uploadFile } from './files'

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 201, headers: { 'Content-Type': 'application/json' } })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('uploadFile', () => {
  it('POSTs a multipart form to /files without forcing a JSON content-type', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ file_id: 'file-1', name: 'passport.png', mime_type: 'image/png', size: 1024, scan_status: 'NOT_SCANNED' }),
    )
    const file = new File(['x'], 'passport.png', { type: 'image/png' })

    await uploadFile({ file, purpose: 'worker_document', workerId: 'W-1' })

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/files')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBeInstanceOf(FormData)
    const headers = new Headers(init?.headers)
    expect(headers.has('Content-Type')).toBe(false)
  })
})
