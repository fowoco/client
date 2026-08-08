import { apiFetch } from './client'
import type { DocumentType } from './documents'

export type WorkerResponseType =
  | 'ACKNOWLEDGED'
  | 'QUESTION'
  | 'NOT_UNDERSTOOD'
  | 'DOCUMENT_SUBMITTED'
  | 'DIFFICULT'

export interface WorkerLinkIssueBody {
  expires_in_hours?: number
  rotate_existing: boolean
}

export interface WorkerLinkIssueResponse {
  worker_url: string
  expires_at: string
}

export interface WorkerLinkViewResponse {
  guidance: string
  language: string
  due_date: string | null
  requested_document_types: DocumentType[]
  allowed_responses: WorkerResponseType[]
}

export interface WorkerLinkDocumentUploadResponse {
  upload_id: string
  file_name: string
  size: number
  expires_at: string
}

export interface WorkerResponseSubmitBody {
  response_type: WorkerResponseType
  message?: string
  upload_ids?: string[]
  idempotency_key: string
}

export interface WorkerResponseSubmitResponse {
  response_id: string
  received_at: string
}

export function issueWorkerLink(
  taskId: string,
  body: WorkerLinkIssueBody,
  idempotencyKey: string,
): Promise<WorkerLinkIssueResponse> {
  return apiFetch<WorkerLinkIssueResponse>(`/tasks/${encodeURIComponent(taskId)}/worker-link`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  })
}

export function fetchWorkerLink(token: string): Promise<WorkerLinkViewResponse> {
  return apiFetch<WorkerLinkViewResponse>(`/public/worker-links/${encodeURIComponent(token)}`, {
    skipAuthRetry: true,
  })
}

export function uploadWorkerLinkDocument(
  token: string,
  file: File,
  clientRequestId: string,
  documentType?: string,
): Promise<WorkerLinkDocumentUploadResponse> {
  const body = new FormData()
  body.set('file', file)
  body.set('clientRequestId', clientRequestId)
  if (documentType) body.set('documentType', documentType)

  return apiFetch<WorkerLinkDocumentUploadResponse>(
    `/public/worker-links/${encodeURIComponent(token)}/documents`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': clientRequestId },
      body,
      skipAuthRetry: true,
    },
  )
}

export function submitWorkerResponse(
  token: string,
  body: WorkerResponseSubmitBody,
): Promise<WorkerResponseSubmitResponse> {
  return apiFetch<WorkerResponseSubmitResponse>(
    `/public/worker-links/${encodeURIComponent(token)}/responses`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuthRetry: true,
    },
  )
}

export function resolveWorkerPortalUrl(workerUrlOrToken: string, origin: string): string {
  if (/^https?:\/\//i.test(workerUrlOrToken)) return workerUrlOrToken
  if (workerUrlOrToken.startsWith('/')) return new URL(workerUrlOrToken, origin).toString()
  return `${origin}/worker-portal/${encodeURIComponent(workerUrlOrToken)}`
}
