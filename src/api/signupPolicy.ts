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
