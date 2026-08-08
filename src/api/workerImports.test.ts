import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  commitWorkerImport,
  createWorkerImport,
  fetchWorkerImport,
  patchWorkerImportRows,
  retryWorkerImport,
  saveWorkerImportMappings,
  validateWorkerImport,
  type WorkerImportResponse,
} from './workerImports'

const IMPORT_RESPONSE: WorkerImportResponse = {
  import_id: 'import-1',
  source_file_id: 'file-1',
  status: 'UPLOADED',
  source_headers: ['이름', '국적'],
  mappings: {},
  total_rows: 1,
  valid_rows: 0,
  invalid_rows: 0,
  excluded_rows: 0,
  committed_rows: 0,
  source_file_expires_at: '2026-08-10T00:00:00Z',
  version: 1,
  rows: [],
  page: 0,
  size: 100,
}

function jsonResponse() {
  return new Response(JSON.stringify(IMPORT_RESPONSE), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse()))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('worker import API', () => {
  it('creates an import with multipart data and an idempotency key', async () => {
    const file = new File(['name,country'], 'workers.csv', { type: 'text/csv' })

    await createWorkerImport(file, 'import-create-1')

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(String(url)).toContain('/imports')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBeInstanceOf(FormData)
    expect((init?.body as FormData).get('file')).toBe(file)
    expect(headers.get('Idempotency-Key')).toBe('import-create-1')
    expect(headers.has('Content-Type')).toBe(false)
  })

  it('gets an import with bounded page parameters', async () => {
    await fetchWorkerImport('import/1', { page: 2, size: 50 })

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/imports/import%2F1?page=2&size=50')
    expect(init?.method).toBeUndefined()
  })

  it('saves column mappings with the latest version', async () => {
    await saveWorkerImportMappings('import-1', {
      expected_version: 1,
      mappings: { 이름: 'display_name', 국적: 'nationality_code' },
    })

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect(init?.method).toBe('PUT')
    expect(JSON.parse(init?.body as string)).toEqual({
      expected_version: 1,
      mappings: { 이름: 'display_name', 국적: 'nationality_code' },
    })
  })

  it('validates an import with the latest version', async () => {
    await validateWorkerImport('import-1', 2)

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/imports/import-1/validate')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({ expected_version: 2 })
  })

  it('patches corrected or excluded rows with the latest version', async () => {
    await patchWorkerImportRows('import-1', {
      expected_version: 3,
      rows: [{ row_number: 2, excluded: false, values: { display_name: '응웬반A' } }],
    })

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/imports/import-1/rows')
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(init?.body as string)).toEqual({
      expected_version: 3,
      rows: [{ row_number: 2, excluded: false, values: { display_name: '응웬반A' } }],
    })
  })

  it('commits selected valid rows with an idempotency key and latest version', async () => {
    await commitWorkerImport(
      'import-1',
      { expected_version: 4, selected_row_numbers: [2, 4] },
      'import-commit-1',
    )

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/imports/import-1/commit')
    expect(init?.method).toBe('POST')
    expect(new Headers(init?.headers).get('Idempotency-Key')).toBe('import-commit-1')
    expect(JSON.parse(init?.body as string)).toEqual({
      expected_version: 4,
      selected_row_numbers: [2, 4],
    })
  })

  it('retries validation with the latest version', async () => {
    await retryWorkerImport('import-1', 5)

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/imports/import-1/retry')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({ expected_version: 5 })
  })
})
