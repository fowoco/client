import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadFile, uploadFile } from './files'

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

describe('downloadFile', () => {
  it('downloads encoded file content and reads the server filename', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(new Blob(['pdf']), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': "attachment; filename*=UTF-8''passport%20copy.pdf",
        },
      }),
    )

    const result = await downloadFile('file/1')

    expect(result.file_name).toBe('passport copy.pdf')
    expect(result.blob.size).toBeGreaterThan(0)
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/files/file%2F1/content')
  })
})
