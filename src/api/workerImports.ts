import { apiFetch } from './client'

export type WorkerImportStatus = 'UPLOADED' | 'MAPPED' | 'REVIEW_REQUIRED' | 'READY' | 'COMMITTED'

export type WorkerImportRowStatus = 'PENDING' | 'VALID' | 'INVALID' | 'EXCLUDED' | 'COMMITTED'

export type WorkerImportField =
  | 'display_name'
  | 'nationality_code'
  | 'preferred_language'
  | 'visa_type'
  | 'stay_expiry_date'
  | 'contract_start_date'
  | 'contract_end_date'
  | 'employment_permit_end_date'
  | 'employment_activity_end_date'

export interface WorkerImportValidationError {
  field: string
  code: string
  message: string
}

export interface WorkerImportRowResponse {
  row_number: number
  source_values: Record<string, string>
  override_values: Record<string, string>
  normalized_values: Record<string, string>
  status: WorkerImportRowStatus
  errors: WorkerImportValidationError[]
  worker_id: string | null
  version: number
}

export interface WorkerImportResponse {
  import_id: string
  source_file_id: string
  status: WorkerImportStatus
  source_headers: string[]
  mappings: Record<string, WorkerImportField>
  total_rows: number
  valid_rows: number
  invalid_rows: number
  excluded_rows: number
  committed_rows: number
  source_file_expires_at: string
  version: number
  rows: WorkerImportRowResponse[]
  page: number
  size: number
}

export interface FetchWorkerImportParams {
  page?: number
  size?: number
}

export interface WorkerImportMappingBody {
  expected_version: number
  mappings: Record<string, WorkerImportField>
}

export interface WorkerImportRowPatch {
  row_number: number
  excluded?: boolean
  values: Record<string, string>
}

export interface WorkerImportRowsBody {
  expected_version: number
  rows: WorkerImportRowPatch[]
}

export interface WorkerImportCommitBody {
  expected_version: number
  selected_row_numbers: number[]
}

function importPath(importId: string, suffix = '') {
  return `/imports/${encodeURIComponent(importId)}${suffix}`
}

export function createWorkerImport(
  file: File,
  idempotencyKey: string,
): Promise<WorkerImportResponse> {
  const body = new FormData()
  body.set('file', file)

  return apiFetch<WorkerImportResponse>('/imports', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body,
  })
}

export function fetchWorkerImport(
  importId: string,
  params: FetchWorkerImportParams = {},
): Promise<WorkerImportResponse> {
  const query = new URLSearchParams({
    page: String(params.page ?? 0),
    size: String(params.size ?? 100),
  })
  return apiFetch<WorkerImportResponse>(`${importPath(importId)}?${query.toString()}`)
}

export function saveWorkerImportMappings(
  importId: string,
  body: WorkerImportMappingBody,
): Promise<WorkerImportResponse> {
  return apiFetch<WorkerImportResponse>(importPath(importId, '/mappings'), {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function validateWorkerImport(
  importId: string,
  expectedVersion: number,
): Promise<WorkerImportResponse> {
  return apiFetch<WorkerImportResponse>(importPath(importId, '/validate'), {
    method: 'POST',
    body: JSON.stringify({ expected_version: expectedVersion }),
  })
}

export function patchWorkerImportRows(
  importId: string,
  body: WorkerImportRowsBody,
): Promise<WorkerImportResponse> {
  return apiFetch<WorkerImportResponse>(importPath(importId, '/rows'), {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function commitWorkerImport(
  importId: string,
  body: WorkerImportCommitBody,
  idempotencyKey: string,
): Promise<WorkerImportResponse> {
  return apiFetch<WorkerImportResponse>(importPath(importId, '/commit'), {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  })
}

export function retryWorkerImport(
  importId: string,
  expectedVersion: number,
): Promise<WorkerImportResponse> {
  return apiFetch<WorkerImportResponse>(importPath(importId, '/retry'), {
    method: 'POST',
    body: JSON.stringify({ expected_version: expectedVersion }),
  })
}
