import { apiFetch } from './client'

// fowoco/server ProfileResponse (GET/PATCH /api/v1/auth/me/profile) 그대로.
export interface ProfileResponse {
  display_name: string
  phone: string | null
  role: 'ADMIN' | 'HR' | 'VIEWER'
  account_status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
  password_changed_at: string
  // 로그인 이력이 전혀 없을 수는 없지만(토큰 자체가 로그인으로만 발급됨) 서버 계약상 null 허용.
  last_login_at: string | null
  last_login_device: string | null
  recent_device_count: number
}

export interface UpdateProfileRequest {
  display_name: string
  phone: string | null
}

export function fetchMyProfile() {
  return apiFetch<ProfileResponse>('/auth/me/profile')
}

export function updateMyProfile(body: UpdateProfileRequest) {
  return apiFetch<ProfileResponse>('/auth/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
