import { apiFetch } from './client'
import type { DocumentType } from './documents'

export type WorkerResponseType =
  'ACKNOWLEDGED' | 'QUESTION' | 'NOT_UNDERSTOOD' | 'DOCUMENT_SUBMITTED' | 'DIFFICULT'

export interface WorkerLinkIssueBody {
  expires_in_hours?: number
  rotate_existing: boolean
}

export interface WorkerLinkIssueResponse {
  worker_link_id: string
  worker_url: string | null
  worker_link_token: string | null
  expires_at: string
  delivery_status: WorkerLinkDeliveryStatus
  sent_at: string | null
  already_issued: boolean
}

export type WorkerLinkStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED'
export type WorkerLinkDeliveryStatus = 'NOT_SENT' | 'SENDING' | 'REVIEW_REQUIRED' | 'SENT'

export interface WorkerLinkDeliveryResponse {
  worker_link_id: string
  link_status: WorkerLinkStatus
  delivery_status: WorkerLinkDeliveryStatus
  sent_at: string | null
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

export type WorkerConversationStatus = 'WAITING_WORKER' | 'NEEDS_FOLLOWUP' | 'REOPENED'

export interface WorkerResponseItemResponse {
  response_id: string
  response_type: WorkerResponseType
  message: string | null
  upload_ids: string[]
  conversation_status: WorkerConversationStatus
  unread: boolean
  received_at: string
}

export interface WorkerResponsePageResponse {
  items: WorkerResponseItemResponse[]
  page: number
  size: number
  total_elements: number
  total_pages: number
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

export function fetchTaskWorkerLinkDelivery(taskId: string): Promise<WorkerLinkDeliveryResponse> {
  return apiFetch<WorkerLinkDeliveryResponse>(`/tasks/${encodeURIComponent(taskId)}/worker-link`)
}

export function markWorkerLinkSent(workerLinkId: string): Promise<WorkerLinkDeliveryResponse> {
  return apiFetch<WorkerLinkDeliveryResponse>(
    `/worker-links/${encodeURIComponent(workerLinkId)}/sent`,
    { method: 'POST' },
  )
}

export interface WorkerLinkSmsDeliveryBody {
  recipient_phone: string
  worker_link_token: string
}

// 링크 발급 때 쓴 것과 같은 idempotencyKey를 넘겨야 서버가 요청-토큰 일치를 검증한다.
export function sendWorkerLinkSms(
  workerLinkId: string,
  body: WorkerLinkSmsDeliveryBody,
  idempotencyKey: string,
): Promise<WorkerLinkDeliveryResponse> {
  return apiFetch<WorkerLinkDeliveryResponse>(
    `/worker-links/${encodeURIComponent(workerLinkId)}/sms-deliveries`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(body),
    },
  )
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

export function fetchTaskWorkerResponses(
  taskId: string,
  page = 0,
  size = 20,
): Promise<WorkerResponsePageResponse> {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  return apiFetch<WorkerResponsePageResponse>(
    `/tasks/${encodeURIComponent(taskId)}/worker-responses?${query.toString()}`,
  )
}

export function markTaskWorkerResponsesRead(taskId: string): Promise<void> {
  return apiFetch<void>(`/tasks/${encodeURIComponent(taskId)}/worker-responses/read`, {
    method: 'POST',
  })
}

export function resolveWorkerPortalUrl(workerUrlOrToken: string, origin: string): string {
  if (/^https?:\/\//i.test(workerUrlOrToken)) return workerUrlOrToken
  if (workerUrlOrToken.startsWith('/')) return new URL(workerUrlOrToken, origin).toString()
  return `${origin}/worker-portal/${encodeURIComponent(workerUrlOrToken)}`
}
