import { apiFetch } from './client'

export type NotificationTargetType = 'TASK' | 'WORKER' | 'DOCUMENT'

export interface NotificationItemResponse {
  id: string
  target_type: NotificationTargetType
  target_id: string
  route: string
  title: string
  read: boolean
  occurred_at: string
}

export interface NotificationPageResponse {
  items: NotificationItemResponse[]
  unread_count: number
  has_next: boolean
  next_cursor: string | null
}

export interface FetchNotificationsParams {
  unreadOnly?: boolean
  cursor?: string
  size?: number
}

export function fetchNotifications(
  params: FetchNotificationsParams = {},
): Promise<NotificationPageResponse> {
  const query = new URLSearchParams()
  if (params.unreadOnly !== undefined) query.set('unreadOnly', String(params.unreadOnly))
  if (params.cursor) query.set('cursor', params.cursor)
  query.set('size', String(params.size ?? 20))

  return apiFetch<NotificationPageResponse>(`/notifications?${query.toString()}`)
}

export function markNotificationRead(notificationId: string): Promise<void> {
  return apiFetch<void>(`/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'POST',
  })
}

