import { apiFetch } from './client'

// fowoco/server AuditController / audit 도메인 기준 (#11 Audit API).
export type ActorType = 'HR_USER' | 'WORKER_LINK' | 'AI_AGENT' | 'SYSTEM_RULE'

export type AuditAction =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'CHECKLIST_ITEM_UPDATED'
  | 'TASK_CANCELLED'
  | 'APPROVAL_REQUESTED'
  | 'TASK_APPROVED'
  | 'TASK_REJECTED'
  | 'APPROVAL_INVALIDATED'
  | 'EXTERNAL_SUBMISSION_RECORDED'
  | 'EVIDENCE_RECORDED'
  | 'TASK_COMPLETED'
  | 'FILE_UPLOADED'
  | 'FILE_DOWNLOADED'
  | 'WORKER_DOCUMENT_FILE_LINKED'
  | 'DOCUMENT_REQUEST_DRAFT_SAVED'
  | 'AI_RUN_CREATED'
  | 'AI_RUN_ANSWERS_SUBMITTED'
  | 'AI_RUN_CANDIDATES_DECIDED'
  | 'OUTBOX_MANUAL_RETRY_REQUESTED'
  | 'WORKER_LINK_RESPONSE_SUBMITTED'
  | 'WORKER_LINK_RESPONSES_REVIEWED'
  | 'WORKER_LINK_ACCESSED'
  | 'USER_AGREEMENTS_RECORDED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'

export type AuditTargetType =
  | 'TASK'
  | 'APPROVAL_REQUEST'
  | 'EXTERNAL_SUBMISSION'
  | 'EVIDENCE'
  | 'FILE'
  | 'WORKER_DOCUMENT'
  | 'DOCUMENT_REQUEST_DRAFT'
  | 'AI_RUN'
  | 'OUTBOX_EVENT'
  | 'USER_ACCOUNT'

export interface AuditEventResponse {
  audit_event_id: string
  actor_type: ActorType
  actor_id: string
  user_role: 'ADMIN' | 'HR' | 'VIEWER' | null
  action: AuditAction
  target_type: AuditTargetType
  target_id: string
  request_id: string
  trace_id: string
  event_version: string
  change_summary: string | null
  created_at: string
}

export interface AuditPageResponse {
  items: AuditEventResponse[]
  next_cursor: string | null
}

// GET /api/v1/tasks/{taskId}/activities — VIEWER도 조회 가능한 화면용 안전 타임라인.
export function fetchTaskActivities(taskId: string): Promise<AuditEventResponse[]> {
  return apiFetch<AuditEventResponse[]>(`/tasks/${encodeURIComponent(taskId)}/activities`)
}

export interface FetchAuditEventsParams {
  actorType?: ActorType
  action?: AuditAction
  targetType?: AuditTargetType
  targetId?: string
  createdFrom?: string
  createdTo?: string
  cursor?: string
  limit?: number
}

// GET /api/v1/audit-events — ADMIN 전용, cursor 기반 페이지네이션.
export function fetchAuditEvents(params: FetchAuditEventsParams = {}): Promise<AuditPageResponse> {
  const query = new URLSearchParams()
  if (params.actorType) query.set('actor_type', params.actorType)
  if (params.action) query.set('action', params.action)
  if (params.targetType) query.set('target_type', params.targetType)
  if (params.targetId) query.set('target_id', params.targetId)
  if (params.createdFrom) query.set('created_from', params.createdFrom)
  if (params.createdTo) query.set('created_to', params.createdTo)
  if (params.cursor) query.set('cursor', params.cursor)
  query.set('limit', String(params.limit ?? 50))
  return apiFetch<AuditPageResponse>(`/audit-events?${query.toString()}`)
}
