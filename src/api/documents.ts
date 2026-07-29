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
