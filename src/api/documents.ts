import { apiFetch } from './client'

// fowoco/server DocumentController 기준 (#57 통합 문서함·파일 업로드·문서 준비도 구현).
export type DocumentType = 'PASSPORT_COPY' | 'ARC' | 'CONTRACT' | 'PERMIT'
export type SubmissionStatus = 'MISSING' | 'SUBMITTED' | 'VERIFIED'

export interface DocumentItemResponse {
  worker_document_id: string
  worker_id: string
  display_name: string | null
  document_type: DocumentType
  submission_status: SubmissionStatus
  expiry_date: string | null
  file_id: string | null
}

export interface DocumentPageResponse {
  items: DocumentItemResponse[]
  page: number
  size: number
  total_elements: number
}

export interface FetchDocumentsParams {
  workerId?: string
  documentType?: DocumentType
  status?: SubmissionStatus
  expiryBefore?: string
  page?: number
  size?: number
}

// GET /api/v1/documents에는 자유 텍스트 검색 파라미터가 없다 — 목록 화면의 검색창은
// 받아온 페이지 안에서만 클라이언트 필터링한다.
export function fetchDocuments(params: FetchDocumentsParams = {}): Promise<DocumentPageResponse> {
  const query = new URLSearchParams()
  if (params.workerId) query.set('workerId', params.workerId)
  if (params.documentType) query.set('documentType', params.documentType)
  if (params.status) query.set('status', params.status)
  if (params.expiryBefore) query.set('expiryBefore', params.expiryBefore)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 100))
  return apiFetch<DocumentPageResponse>(`/documents?${query.toString()}`)
}

export interface DocumentReadinessResponse {
  required: DocumentType[]
  available: DocumentType[]
  missing: DocumentType[]
  expired: DocumentType[]
  completion_blocked: boolean
}

// Task 생성 시점 체크리스트 snapshot 기준이라 Workflow Catalog를 실시간으로 다시 읽지 않는다 (#176).
export function fetchDocumentReadiness(taskId: string): Promise<DocumentReadinessResponse> {
  return apiFetch<DocumentReadinessResponse>(`/tasks/${encodeURIComponent(taskId)}/document-readiness`)
}

export interface DocumentRequestUpsertBody {
  language: string
  document_types: DocumentType[]
  message?: string
  expected_version: number
}

export interface DocumentRequestDraftResponse {
  draft_id: string
  version: number
  review_status: string
}

// 초안 저장만 하고 실제 발송·Worker Link 생성은 하지 않는다 (#176 스코프 아님).
// 최초 생성 시 expected_version은 관례상 0을 보낸다.
export function upsertDocumentRequestDraft(
  taskId: string,
  body: DocumentRequestUpsertBody,
): Promise<DocumentRequestDraftResponse> {
  return apiFetch<DocumentRequestDraftResponse>(
    `/tasks/${encodeURIComponent(taskId)}/document-request-draft`,
    { method: 'PUT', body: JSON.stringify(body) },
  )
}
