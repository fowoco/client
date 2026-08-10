import { apiFetch } from './client'

export type ApprovalPolicy = 'ADMIN_ONLY' | 'ADMIN_OR_HR'
export type AuditVisibility = 'ADMIN_ONLY' | 'ADMIN_AND_HR'
export type CompanyMemberRole = 'ADMIN' | 'HR' | 'VIEWER'
export type EvidenceType = 'DOCUMENT' | 'RECEIPT' | 'OFFICIAL_RESULT' | 'HR_CONFIRMATION'
export type SettingsTaskType =
  | 'RECONTRACT'
  | 'EMPLOYMENT_PERIOD_EXTENSION'
  | 'STAY_PERIOD_EXTENSION'
  | 'DOCUMENT_REQUEST'
  | 'WORKER_ONBOARDING'
  | 'PAYROLL_EXPLANATION'
  | 'EMPLOYMENT_CHANGE'
  | 'WORK_INSTRUCTION'

export interface CompanySettingsResponse {
  approval_policy: ApprovalPolicy
  link_expiry_hours: number
  evidence_rules: Partial<Record<SettingsTaskType, EvidenceType[]>>
  file_retention_days: number
  ai_log_retention_days: number
  audit_visibility: AuditVisibility
  version: number
}

export interface CompanySettingsPatchBody {
  expected_version: number
  approval_policy?: ApprovalPolicy
  link_expiry_hours?: number
  evidence_rules?: Partial<Record<SettingsTaskType, EvidenceType[]>>
  file_retention_days?: number
  ai_log_retention_days?: number
  audit_visibility?: AuditVisibility
}

export interface CompanyMemberItemResponse {
  user_id: string
  display_name: string
  roles?: CompanyMemberRole[]
  active?: boolean
  approval_permission?: boolean
}

export interface CompanyMemberListResponse {
  items: CompanyMemberItemResponse[]
}

export interface FetchCompanyMembersParams {
  role?: CompanyMemberRole
  approvalCapable?: boolean
  activeOnly?: boolean
}

export function fetchCompanySettings(): Promise<CompanySettingsResponse> {
  return apiFetch<CompanySettingsResponse>('/settings')
}

export function patchCompanySettings(
  body: CompanySettingsPatchBody,
): Promise<CompanySettingsResponse> {
  return apiFetch<CompanySettingsResponse>('/settings', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function fetchCompanyMembers(
  params: FetchCompanyMembersParams = {},
): Promise<CompanyMemberListResponse> {
  const query = new URLSearchParams()
  if (params.role) query.set('role', params.role)
  if (params.approvalCapable !== undefined) {
    query.set('approval_capable', String(params.approvalCapable))
  }
  query.set('active_only', String(params.activeOnly ?? true))
  return apiFetch<CompanyMemberListResponse>(`/company-members?${query.toString()}`)
}

