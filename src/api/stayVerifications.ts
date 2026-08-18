import { apiFetch } from './client'

export type StayVerificationStatus =
  'APPROVED' | 'APPLICATION_PENDING' | 'UNKNOWN' | 'NOT_APPLIED' | 'EMPLOYMENT_ENDED'

export interface StayVerificationResponse {
  stay_verification_id: string
  worker_id: string
  worker_display_name: string
  source_stay_expiry_date: string
  verification_status: StayVerificationStatus
  status_checked_at: string | null
  extension_applied_at: string | null
  extension_receipt_document_id: string | null
  approval_result_document_id: string | null
  new_stay_expiry_date: string | null
  official_consultation_note: string | null
  employment_end_confirmed_at: string | null
  recheck_date: string | null
  employment_change_candidate_available: boolean
  suggested_workflow_id: string | null
  version: number
}

export interface StayVerificationUpdateBody {
  status: StayVerificationStatus
  extension_applied_at?: string
  extension_receipt_document_id?: string
  approval_result_document_id?: string
  new_stay_expiry_date?: string
  official_consultation_note?: string
  employment_end_confirmed_at?: string
  recheck_date?: string
  expected_version: number
}

export function scanExpiredStayWorkers(): Promise<{ created_count: number }> {
  return apiFetch('/stay-verifications/scan', { method: 'POST' })
}

export function fetchStayVerifications(): Promise<StayVerificationResponse[]> {
  return apiFetch('/stay-verifications')
}

export async function ensureStayVerification(
  workerId: string,
): Promise<StayVerificationResponse | null> {
  let cases = await fetchStayVerifications()
  let verification = cases.find((item) => item.worker_id === workerId)
  if (verification) return verification

  await scanExpiredStayWorkers()
  cases = await fetchStayVerifications()
  verification = cases.find((item) => item.worker_id === workerId)
  return verification ?? null
}

export function updateStayVerification(
  stayVerificationId: string,
  body: StayVerificationUpdateBody,
): Promise<StayVerificationResponse> {
  return apiFetch(`/stay-verifications/${encodeURIComponent(stayVerificationId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
