import { apiFetch } from './client'

// fowoco/server DocumentController 기준 (#57 통합 문서함·파일 업로드·문서 준비도 구현).
export type DocumentType =
  | 'PASSPORT_COPY'
  | 'ARC'
  | 'CONTRACT'
  | 'PERMIT'
  | 'EMPLOYMENT_EXTENSION_APPLICATION'
  | 'INTEGRATED_APPLICATION'
  | 'RESIDENCE_PROOF'
export type SubmissionStatus = 'DRAFT' | 'MISSING' | 'SUBMITTED' | 'VERIFIED'

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

export interface DocumentDetailResponse extends DocumentItemResponse {
  task_id: string | null
  version: number
  file_name: string | null
  file_mime_type: string | null
  file_size: number | null
  file_scan_status: 'NOT_SCANNED' | 'CLEAN' | 'INFECTED' | null
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

const DOCUMENT_PAGE_SIZE = 100

export async function fetchAllDocuments(
  params: Omit<FetchDocumentsParams, 'page' | 'size'> = {},
): Promise<DocumentPageResponse> {
  const firstPage = await fetchDocuments({ ...params, page: 0, size: DOCUMENT_PAGE_SIZE })
  const pageCount = Math.ceil(firstPage.total_elements / DOCUMENT_PAGE_SIZE)
  if (pageCount <= 1) return firstPage

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      fetchDocuments({ ...params, page: index + 1, size: DOCUMENT_PAGE_SIZE }),
    ),
  )
  const itemsById = new Map(
    [firstPage, ...remainingPages]
      .flatMap((page) => page.items)
      .map((document) => [document.worker_document_id, document]),
  )

  return {
    items: [...itemsById.values()],
    page: 0,
    size: itemsById.size,
    total_elements: firstPage.total_elements,
  }
}

export function fetchDocument(documentId: string): Promise<DocumentDetailResponse> {
  return apiFetch<DocumentDetailResponse>(`/documents/${encodeURIComponent(documentId)}`)
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
  return apiFetch<DocumentReadinessResponse>(
    `/tasks/${encodeURIComponent(taskId)}/document-readiness`,
  )
}

export interface DocumentRequestUpsertBody {
  language: string
  document_types: DocumentType[]
  message?: string
  expected_version: number
}

export interface DocumentRequestDraftResponse {
  draft_id: string
  language: string
  document_types: DocumentType[]
  message: string | null
  version: number
  review_status: string
  updated_at: string
}

export function fetchDocumentRequestDraft(taskId: string): Promise<DocumentRequestDraftResponse> {
  return apiFetch<DocumentRequestDraftResponse>(
    `/tasks/${encodeURIComponent(taskId)}/document-request-draft`,
  )
}

// 초안 저장만 하고 실제 발송·Worker Link 생성은 하지 않는다. 최초 생성 시
// expected_version은 0, 이후에는 fetchDocumentRequestDraft가 반환한 최신 version을 보낸다.
export function upsertDocumentRequestDraft(
  taskId: string,
  body: DocumentRequestUpsertBody,
): Promise<DocumentRequestDraftResponse> {
  return apiFetch<DocumentRequestDraftResponse>(
    `/tasks/${encodeURIComponent(taskId)}/document-request-draft`,
    { method: 'PUT', body: JSON.stringify(body) },
  )
}

export interface WorkerDocumentResponse {
  worker_document_id: string
  worker_id: string
  document_type: DocumentType
  submission_status: SubmissionStatus
  expiry_date: string | null
  destination: string | null
  note: string | null
  file_id: string | null
  created_at: string
  updated_at: string
  version: number
}

export interface WorkerDocumentCreateBody {
  document_type: DocumentType
  submission_status: SubmissionStatus
  expiry_date?: string
  destination?: string
  note?: string
}

// MVP는 메타데이터 중심이라 등록 시점에는 file_id를 받지 않는다 — 파일을 붙이려면
// 등록 응답의 worker_document_id·version으로 이어서 patchWorkerDocument를 호출한다.
export function registerWorkerDocument(
  workerId: string,
  body: WorkerDocumentCreateBody,
): Promise<WorkerDocumentResponse> {
  return apiFetch<WorkerDocumentResponse>(`/workers/${encodeURIComponent(workerId)}/documents`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export interface WorkerDocumentPatchBody {
  document_type?: DocumentType
  submission_status?: SubmissionStatus
  expiry_date?: string
  destination?: string
  note?: string
  file_id?: string
  expected_version: number
}

export function patchWorkerDocument(
  workerId: string,
  documentId: string,
  body: WorkerDocumentPatchBody,
): Promise<WorkerDocumentResponse> {
  return apiFetch<WorkerDocumentResponse>(
    `/workers/${encodeURIComponent(workerId)}/documents/${encodeURIComponent(documentId)}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  )
}
