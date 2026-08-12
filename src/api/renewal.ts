import { apiFetch } from './client'
import type { TaskStatus } from './tasks'

export interface RenewalRequestedField {
  key: string
  source_hint: string
}

export interface GeneratedDocumentResult {
  template_id: string
  format: string
  status: string
  stored_file_id: string | null
  worker_document_id: string | null
}

export interface RenewalExecutionResponse {
  request_id: string
  task_id: string
  task_status: TaskStatus
  task_version: number
  intent: string
  workflow_id: string
  confidence: number
  scenario: string
  outcome: string
  missing_slots: string[]
  requested_fields: RenewalRequestedField[]
  case_signals: string[]
  generated_documents: GeneratedDocumentResult[]
  worker_message_draft_id: string | null
  worker_message_draft_version: number | null
  human_review_required: boolean
}

export interface RenewalExecutionBody {
  instruction: string
  expected_version: number
  slot_answers?: Record<string, string>
}

// fowoco/server RenewalExecutionController 기준. slot_answers는 requested_fields 중
// source_hint가 "USER_INPUT"인 key만 허용 — 그 외(OCR 등)를 보내면 422로 거부된다.
export function runRenewalExecution(
  taskId: string,
  body: RenewalExecutionBody,
): Promise<RenewalExecutionResponse> {
  return apiFetch<RenewalExecutionResponse>(`/tasks/${encodeURIComponent(taskId)}/renewal-run`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
