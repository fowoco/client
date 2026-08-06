import { apiFetch } from './client'
import type { TaskStatus, TaskType } from './tasks'

// fowoco/server CaseController 기준 (#88 업무함 Case·Workflow Snapshot 조회).
export type CaseDisplayStatus =
  | 'DOCUMENT_PENDING'
  | 'REQUEST_SENT'
  | 'REVIEW_REQUIRED'
  | 'COMPLETED'
  | 'CANCELLED'

export type CaseLifecycleStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type CasePriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'

export interface CaseTaskResponse {
  task_id: string
  task_type: TaskType
  title: string
  status: TaskStatus
  due_date: string | null
}

export interface CaseProgressResponse {
  completed_steps: number
  total_steps: number
  percentage: number
}

export interface CaseSummaryResponse {
  case_id: string
  worker_id: string
  worker_display_name: string
  title: string
  display_status: CaseDisplayStatus
  has_unread_response: boolean
  priority: CasePriority
  progress: CaseProgressResponse
  due_date: string | null
  current_task: CaseTaskResponse | null
  updated_at: string
}

export interface CasePageResponse {
  items: CaseSummaryResponse[]
  page: number
  size: number
  total_elements: number
  total_pages: number
}

export interface CaseReadinessResponse {
  completed_checklist_items: number
  total_checklist_items: number
  verified_documents: number
  total_documents: number
  pending_approvals: number
  approved_approvals: number
  worker_responses: number
  evidence_items: number
}

export interface CaseProjectionResponse extends CaseSummaryResponse {
  lifecycle_status: CaseLifecycleStatus
  readiness: CaseReadinessResponse
  tasks: CaseTaskResponse[]
  workflow_catalog_version: string
  workflow_snapshot: Record<string, unknown>
}

export interface FetchCasesParams {
  keyword?: string
  page?: number
  size?: number
}

export function fetchCases(params: FetchCasesParams = {}): Promise<CasePageResponse> {
  const query = new URLSearchParams()
  if (params.keyword) query.set('keyword', params.keyword)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 100))
  return apiFetch<CasePageResponse>(`/cases?${query.toString()}`)
}

export function fetchCaseProjection(caseId: string): Promise<CaseProjectionResponse> {
  return apiFetch<CaseProjectionResponse>(`/cases/${encodeURIComponent(caseId)}/projection`)
}
