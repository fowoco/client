import { apiFetch } from './client'

export interface AgreementPolicy {
  version: string
  required: boolean
  content_path: string | null
}

export interface SignupPolicy {
  password_policy: {
    min_length: number
    max_length: number
    require_letter: boolean
    require_digit: boolean
  }
  account_protection: {
    max_failed_attempts: number
    lock_duration_seconds: number
    password_max_age_days: number
  }
  agreements: {
    service_terms: AgreementPolicy
    privacy_policy: AgreementPolicy
    marketing: AgreementPolicy
  }
}

export function fetchSignupPolicy() {
  return apiFetch<SignupPolicy>('/auth/signup-policy', {
    method: 'GET',
    skipAuthRetry: true,
  })
}
