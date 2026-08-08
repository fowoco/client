import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createDocumentOcrRun,
  fetchDocumentOcrRun,
  fetchLatestDocumentOcrRun,
  reviewDocumentOcrRun,
} from './documentOcr'

function jsonResponse() {
  return new Response(
    JSON.stringify({
      ocr_run_id: 'run-1',
      document_id: 'document-1',
      file_id: 'file-1',
      document_type: 'ARC',
      status: 'QUEUED',
      result: null,
      corrected_fields: {},
      error_code: null,
      reviewed_by: null,
      review_reason: null,
      created_at: '2026-08-09T00:00:00Z',
      started_at: null,
      completed_at: null,
      reviewed_at: null,
      updated_at: '2026-08-09T00:00:00Z',
      version: 0,
      already_requested: false,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse()))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('document OCR API', () => {
  it('starts an OCR run with an idempotency key', async () => {
    await createDocumentOcrRun('document/1', 'ocr-request-1')

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/documents/document%2F1/ocr-runs')
    expect(init?.method).toBe('POST')
    expect(new Headers(init?.headers).get('Idempotency-Key')).toBe('ocr-request-1')
  })

  it('gets one OCR run', async () => {
    await fetchDocumentOcrRun('document-1', 'run/1')

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/documents/document-1/ocr-runs/run%2F1')
    expect(init?.method).toBeUndefined()
  })

  it('gets the latest OCR run for the document', async () => {
    await fetchLatestDocumentOcrRun('document-1')

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/documents/document-1/ocr-runs/latest')
  })

  it('submits HR corrections and the latest version for review', async () => {
    await reviewDocumentOcrRun('document-1', 'run-1', {
      expected_version: 2,
      decision: 'APPROVE',
      corrected_fields: { stay_expiration_date: '2026-12-31' },
    })

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/documents/document-1/ocr-runs/run-1/review')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({
      expected_version: 2,
      decision: 'APPROVE',
      corrected_fields: { stay_expiration_date: '2026-12-31' },
    })
  })
})
