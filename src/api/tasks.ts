import { apiFetch } from './client'

// fowoco/server TaskController / Task 도메인 기준 (#6 Task Workflow API).
export type TaskStatus =
  | 'DRAFT'
  | 'NEEDS_INFO'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'WAITING_WORKER'
  | 'WAITING_EXTERNAL'
  | 'COMPLETED'
  | 'CANCELLED'

export type TaskType =
  | 'RECONTRACT'
  | 'EMPLOYMENT_PERIOD_EXTENSION'
  | 'STAY_PERIOD_EXTENSION'
  | 'DOCUMENT_REQUEST'
  | 'WORKER_ONBOARDING'
  | 'PAYROLL_EXPLANATION'
  | 'EMPLOYMENT_CHANGE'
  | 'WORK_INSTRUCTION'
export type TaskTargetType = 'WORKER' | 'COMPANY'
export type TaskSource = 'MANUAL' | 'SYSTEM_DDAY' | 'AI_CANDIDATE'

export interface TaskChecklistItemResponse {
  checklist_item_id: string
  item_code: string
  label: string
  required: boolean
  completed: boolean
  completed_by: string | null
  completed_at: string | null
  version: number
}

export interface TaskDetailResponse {
  task_id: string
  target_type: TaskTargetType
  worker_id: string | null
  case_id: string | null
  task_type: TaskType
  workflow_id: string
  workflow_catalog_version: string
  title: string
  description: string | null
  business_data: Record<string, unknown>
  source: TaskSource
  status: TaskStatus
  due_date: string | null
  content_revision: number
  version: number
  missing_required_slots: string[]
  checklist_items: TaskChecklistItemResponse[]
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface TaskSummaryResponse {
  task_id: string
  target_type: TaskTargetType
  worker_id: string | null
  case_id: string | null
  task_type: TaskType
  workflow_id: string
  workflow_catalog_version: string
  title: string
  source: TaskSource
  status: TaskStatus
  due_date: string | null
  content_revision: number
  version: number
  created_at: string
  updated_at: string
}

export interface TaskPageResponse {
  items: TaskSummaryResponse[]
  page: number
  size: number
  total_elements: number
  total_pages: number
}

export interface FetchTasksParams {
  status?: TaskStatus
  taskType?: TaskType
  targetType?: TaskTargetType
  source?: TaskSource
  workerId?: string
  caseId?: string
  dueFrom?: string
  dueTo?: string
  keyword?: string
  page?: number
  size?: number
}

export function fetchTasks(params: FetchTasksParams = {}): Promise<TaskPageResponse> {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.taskType) query.set('taskType', params.taskType)
  if (params.targetType) query.set('target_type', params.targetType)
  if (params.source) query.set('source', params.source)
  if (params.workerId) query.set('workerId', params.workerId)
  if (params.caseId) query.set('case_id', params.caseId)
  if (params.dueFrom) query.set('dueFrom', params.dueFrom)
  if (params.dueTo) query.set('dueTo', params.dueTo)
  if (params.keyword) query.set('keyword', params.keyword)
  query.set('page', String(params.page ?? 0))
  query.set('size', String(params.size ?? 100))
  return apiFetch<TaskPageResponse>(`/tasks?${query.toString()}`)
}

export function fetchTaskById(taskId: string): Promise<TaskDetailResponse> {
  return apiFetch<TaskDetailResponse>(`/tasks/${encodeURIComponent(taskId)}`)
}

interface CreateTaskFields {
  case_id?: string
  task_type: TaskType
  workflow_id: string
  title: string
  description?: string
  due_date?: string
  business_data?: Record<string, unknown>
}

export type CreateTaskBody = CreateTaskFields &
  ({ target_type?: 'WORKER'; worker_id: string } | { target_type: 'COMPANY'; worker_id?: never })

export function createTask(body: CreateTaskBody): Promise<TaskDetailResponse> {
  return apiFetch<TaskDetailResponse>('/tasks', { method: 'POST', body: JSON.stringify(body) })
}

export interface UpdateTaskBody {
  title: string
  description?: string
  due_date?: string
  business_data: Record<string, unknown>
  expected_version: number
}

export function updateTask(taskId: string, body: UpdateTaskBody): Promise<TaskDetailResponse> {
  return apiFetch<TaskDetailResponse>(`/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export interface UpdateChecklistItemBody {
  completed: boolean
  expected_version: number
  expected_task_version: number
}

export function updateChecklistItem(
  taskId: string,
  itemId: string,
  body: UpdateChecklistItemBody,
): Promise<TaskDetailResponse> {
  return apiFetch<TaskDetailResponse>(
    `/tasks/${encodeURIComponent(taskId)}/checklist-items/${encodeURIComponent(itemId)}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  )
}

export interface CancelTaskBody {
  expected_version: number
  reason: string
}

export function cancelTask(taskId: string, body: CancelTaskBody): Promise<TaskDetailResponse> {
  return apiFetch<TaskDetailResponse>(`/tasks/${encodeURIComponent(taskId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
