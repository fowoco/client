import { apiFetch } from './client'

// fowoco/server ProfileResponse (GET/PATCH /api/v1/auth/me/profile) 그대로.
export interface ProfileResponse {
  display_name: string
  phone: string | null
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
