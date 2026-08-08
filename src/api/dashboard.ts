import type { DocumentType } from './documents'
import { apiFetch } from './client'
import type { TaskStatus } from './tasks'

export interface DashboardSummaryCountsResponse {
  pending_approval: number
  due_today: number
  needs_info: number
  worker_response: number
}

export interface DashboardTaskSummaryResponse {
  task_id: string
  worker_id: string
  title: string
  status: TaskStatus
  due_date: string | null
}

export type UpcomingExpiryCategory =
  | 'STAY_EXPIRY'
  | 'CONTRACT_END'
  | 'EMPLOYMENT_PERMIT_END'
  | 'EMPLOYMENT_ACTIVITY_END'
  | 'DOCUMENT_EXPIRY'

export interface UpcomingExpiryItemResponse {
  worker_id: string
  display_name: string
  category: UpcomingExpiryCategory
  expiry_date: string
  document_type: DocumentType | null
}

export interface DashboardRecommendationItemResponse {
  task_id: string
  title: string
  status: TaskStatus
}

export interface DashboardRecommendationsResponse {
  connected_count: number
  prepared: DashboardRecommendationItemResponse[]
  review: DashboardRecommendationItemResponse[]
  after_approval: DashboardRecommendationItemResponse[]
}

export interface DashboardTodayResponse {
  summary_counts: DashboardSummaryCountsResponse
  priority_tasks: DashboardTaskSummaryResponse[]
  upcoming_7_days: UpcomingExpiryItemResponse[]
  recommendations: DashboardRecommendationsResponse
  approval_count: number
  worker_response_count: number
}

export function fetchDashboardToday(timezone = 'Asia/Seoul'): Promise<DashboardTodayResponse> {
  const query = new URLSearchParams({ timezone })
  return apiFetch<DashboardTodayResponse>(`/dashboard/today?${query.toString()}`)
}
