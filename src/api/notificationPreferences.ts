import { apiFetch } from './client'

// fowoco/server NotificationPreferenceResponse
// (GET/PATCH /api/v1/notifications/preferences) 그대로.
export interface NotificationPreferenceResponse {
  key: string
  enabled: boolean
  required: boolean
}

export function fetchNotificationPreferences() {
  return apiFetch<NotificationPreferenceResponse[]>('/notifications/preferences')
}

export function updateNotificationPreference(key: string, enabled: boolean) {
  return apiFetch<NotificationPreferenceResponse[]>(
    `/notifications/preferences/${encodeURIComponent(key)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    },
  )
}
