import { apiFetch } from './client'
import type { TaskDetailResponse, TaskStatus } from './tasks'

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INVALIDATED'

export interface ApprovalResponse {
  approval_request_id: string
  task_id: string
  approval_status: ApprovalStatus
  task_status: TaskStatus
  content_revision: number
  task_version: number
  requested_at: string
  decided_at: string | null
}

export interface RequestTaskApprovalBody {
  expected_version: number
  ai_snapshot: Record<string, unknown> | null
  hr_snapshot: Record<string, unknown>
  changed_fields: string[]
  source_versions: Record<string, unknown>
}

export interface DecideTaskApprovalBody {
  expected_version: number
  reason?: string
}

export type EvidenceType = 'DOCUMENT' | 'RECEIPT' | 'OFFICIAL_RESULT' | 'HR_CONFIRMATION'

export interface RecordTaskEvidenceBody {
  evidence_type: EvidenceType
  file_reference?: string
  note?: string
  recorded_at?: string
}

export interface TaskActionResponse {
  resource_id: string
  task_id: string
  task_status: TaskStatus
  task_version: number
}

export function buildTaskApprovalSnapshot(task: TaskDetailResponse): RequestTaskApprovalBody {
  return {
    expected_version: task.version,
    ai_snapshot: null,
    hr_snapshot: {
      target_type: task.target_type,
      worker_id: task.worker_id,
      task_type: task.task_type,
      workflow_id: task.workflow_id,
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      business_data: task.business_data,
    },
    changed_fields: ['task_content'],
    source_versions: {
      workflow_catalog_version: task.workflow_catalog_version,
      content_revision: task.content_revision,
    },
  }
}

export function requestTaskApproval(
  taskId: string,
  body: RequestTaskApprovalBody,
): Promise<ApprovalResponse> {
  return apiFetch<ApprovalResponse>(`/tasks/${encodeURIComponent(taskId)}/approval-requests`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function approveTask(
  taskId: string,
  body: DecideTaskApprovalBody,
): Promise<ApprovalResponse> {
  return apiFetch<ApprovalResponse>(`/tasks/${encodeURIComponent(taskId)}/approve`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function rejectTask(
  taskId: string,
  body: Required<Pick<DecideTaskApprovalBody, 'expected_version' | 'reason'>>,
): Promise<ApprovalResponse> {
  return apiFetch<ApprovalResponse>(`/tasks/${encodeURIComponent(taskId)}/reject`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function recordTaskEvidence(
  taskId: string,
  body: RecordTaskEvidenceBody,
): Promise<TaskActionResponse> {
  return apiFetch<TaskActionResponse>(`/tasks/${encodeURIComponent(taskId)}/evidence`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function completeTask(taskId: string, expectedVersion: number): Promise<TaskActionResponse> {
  return apiFetch<TaskActionResponse>(`/tasks/${encodeURIComponent(taskId)}/complete`, {
    method: 'POST',
    body: JSON.stringify({ expected_version: expectedVersion }),
  })
}
