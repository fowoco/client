import { apiFetch } from './client'

export type AiRunStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
export type AiAnalysisOutcome = 'CONTEXT_REQUIRED' | 'NEEDS_INFO' | 'REVIEW_REQUIRED'

export interface AiRunQuestion {
  slot_key: string
  label: string
  input_type: string
  required: boolean
  answer: string | null
}

export interface AiRunCandidate {
  candidate_id: string
  candidate_ref: string
  worker_id: string | null
  workflow_id: string
  extracted_slots: Record<string, string>
  missing_slots: string[]
  confidence: number | null
}

export interface AiRunResponse {
  ai_run_id: string
  request_id: string
  instruction: string
  status: AiRunStatus
  analysis_outcome: AiAnalysisOutcome | null
  detected_intent: string | null
  error_code: string | null
  attempt_count: number
  version: number
  questions: AiRunQuestion[]
  candidates: AiRunCandidate[]
  created_at: string
  updated_at: string
}

export type AiCandidateDecisionAction = 'ACCEPT' | 'DISCARD'

export interface AiCandidateDecisionItem {
  candidate_id: string
  action: AiCandidateDecisionAction
}

export interface AiCandidateDecisionResponse {
  decision_batch_id: string
  ai_run_id: string
  case_id: string | null
  task_ids: string[]
  decisions: AiCandidateDecisionItem[]
  run_version: number
}

export function createAiRun(instruction: string, idempotencyKey: string): Promise<AiRunResponse> {
  return apiFetch<AiRunResponse>('/ai-runs', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ instruction }),
  })
}

export function fetchAiRun(aiRunId: string): Promise<AiRunResponse> {
  return apiFetch<AiRunResponse>(`/ai-runs/${encodeURIComponent(aiRunId)}`)
}

export function submitAiRunAnswers(
  aiRunId: string,
  expectedVersion: number,
  answers: Record<string, string>,
): Promise<AiRunResponse> {
  return apiFetch<AiRunResponse>(`/ai-runs/${encodeURIComponent(aiRunId)}/answers`, {
    method: 'POST',
    body: JSON.stringify({ expected_version: expectedVersion, answers }),
  })
}

export function decideAiRunCandidates(
  aiRunId: string,
  expectedRunVersion: number,
  decisions: AiCandidateDecisionItem[],
  idempotencyKey: string,
): Promise<AiCandidateDecisionResponse> {
  return apiFetch<AiCandidateDecisionResponse>(
    `/ai-runs/${encodeURIComponent(aiRunId)}/candidate-decisions`,
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        expected_run_version: expectedRunVersion,
        decisions,
      }),
    },
  )
}
