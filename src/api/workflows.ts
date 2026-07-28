import { apiFetch } from './client'
import type { TaskType } from './tasks'

// fowoco/server WorkflowCatalogController 기준 (Knowledge release projection).
export interface WorkflowChecklistResponse {
  item_code: string
  label: string
  required: boolean
}

export interface WorkflowDefinitionResponse {
  workflow_id: string
  name: string
  intent: string
  sensitivity: string
  supported_task_types: TaskType[]
  required_slots: string[]
  checklist_items: WorkflowChecklistResponse[]
  completion_evidence: string[]
  source_ids: string[]
}

export interface WorkflowCatalogResponse {
  bundle_id: string
  bundle_version: string
  bundle_status: string
  source_repository: string
  generated_at: string
  workflows: WorkflowDefinitionResponse[]
}

export function fetchWorkflowCatalog(): Promise<WorkflowCatalogResponse> {
  return apiFetch<WorkflowCatalogResponse>('/workflow-catalogs')
}
