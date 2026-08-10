import type { DocumentType } from './documents'
import { apiFetch } from './client'

export type DocumentOcrStatus =
  'QUEUED' | 'RUNNING' | 'READY_FOR_REVIEW' | 'REVIEW_REQUIRED' | 'APPROVED' | 'REJECTED' | 'FAILED'

export type DocumentOcrReviewDecision = 'APPROVE' | 'REJECT'

export interface DocumentOcrResult {
  matched_template_id: number | null
  document_side: 'FRONT' | 'BACK'
  fields: Record<string, string>
  field_confidences: Record<string, number>
  review_reasons: string[]
}

export interface DocumentOcrRunResponse {
  ocr_run_id: string
  document_id: string
  file_id: string
  document_type: DocumentType
  status: DocumentOcrStatus
  result: DocumentOcrResult | null
  corrected_fields: Record<string, string>
  error_code: string | null
  reviewed_by: string | null
  review_reason: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  reviewed_at: string | null
  updated_at: string
  version: number
  already_requested: boolean
}

export interface DocumentOcrReviewBody {
  expected_version: number
  decision: DocumentOcrReviewDecision
  reason?: string
  corrected_fields: Record<string, string>
}

function ocrRunsPath(documentId: string, suffix = '') {
  return `/documents/${encodeURIComponent(documentId)}/ocr-runs${suffix}`
}

export function createDocumentOcrRun(
  documentId: string,
  idempotencyKey: string,
): Promise<DocumentOcrRunResponse> {
  return apiFetch<DocumentOcrRunResponse>(ocrRunsPath(documentId), {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}

export function fetchDocumentOcrRun(
  documentId: string,
  ocrRunId: string,
): Promise<DocumentOcrRunResponse> {
  return apiFetch<DocumentOcrRunResponse>(
    ocrRunsPath(documentId, `/${encodeURIComponent(ocrRunId)}`),
  )
}

export function fetchLatestDocumentOcrRun(documentId: string): Promise<DocumentOcrRunResponse> {
  return apiFetch<DocumentOcrRunResponse>(ocrRunsPath(documentId, '/latest'))
}

export function reviewDocumentOcrRun(
  documentId: string,
  ocrRunId: string,
  body: DocumentOcrReviewBody,
): Promise<DocumentOcrRunResponse> {
  return apiFetch<DocumentOcrRunResponse>(
    ocrRunsPath(documentId, `/${encodeURIComponent(ocrRunId)}/review`),
    { method: 'POST', body: JSON.stringify(body) },
  )
}
