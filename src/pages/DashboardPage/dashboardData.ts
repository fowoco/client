import type {
  DashboardRecommendationItemResponse,
  DashboardRecommendationsResponse,
  DashboardSummaryCountsResponse,
  DashboardTaskSummaryResponse,
  UpcomingExpiryCategory,
  UpcomingExpiryItemResponse,
} from '../../api/dashboard'
import type { TaskStatus } from '../../api/tasks'
import type {
  WorkItemStatusTone,
  WorkItemUrgency,
} from '../../components/ui/WorkItemRow/WorkItemRow'
import { DOCUMENT_TYPE_LABEL } from '../../utils/documentLabels'
import { daysUntil } from '../../utils/urgency'
import { getOperationalDateViewModel } from '../../view-models/dateViewModel'
import metricApprovalIcon from './assets/metric-approval.svg'
import metricDueIcon from './assets/metric-due.svg'
import metricInfoIcon from './assets/metric-info.svg'
import metricResponseIcon from './assets/metric-response.svg'

export const AI_REQUEST_PROMPT_CHIPS = [
  '체류기간 연장',
  '누락 문서 확인',
  '승인 대기 정리',
  '근로자 요청',
]

export type DashboardMetricTone = 'warning' | 'info' | 'critical' | 'success'

export interface DashboardMetric {
  id: string
  label: string
  value: number
  iconSrc: string
  tone: DashboardMetricTone
}

export interface DashboardWorkItem {
  id: string
  title: string
  status: string
  statusTone: WorkItemStatusTone
  schedule: string
  nextAction: string
  urgency: WorkItemUrgency
}

export interface DashboardPriorityApproval {
  id: string
  title: string
  meta: string
  note: string
  requestedLabel: string
}

export interface DashboardAgentItem {
  id: string
  label: string
  description?: string
}

export interface DashboardAgentPrepared {
  connectedCount: number
  prepared: DashboardAgentItem[]
  review: DashboardAgentItem[]
  afterApproval: DashboardAgentItem[]
}

export interface DashboardUpcomingExpiry {
  workerId: string
  workerName: string
  label: string
  dateLabel: string
  urgency: WorkItemUrgency
}

const STATUS_PRESENTATION: Record<
  TaskStatus,
  { label: string; tone: WorkItemStatusTone; action: string }
> = {
  DRAFT: { label: '서류 대기', tone: 'neutral', action: '초안 검토' },
  NEEDS_INFO: { label: '정보 보완', tone: 'warning', action: '정보 확인' },
  READY_FOR_REVIEW: { label: '승인 대기', tone: 'warning', action: '승인 검토' },
  APPROVED: { label: '승인 완료', tone: 'primary', action: '실행 확인' },
  WAITING_WORKER: { label: '요청 전송', tone: 'primary', action: '요청 현황' },
  WAITING_EXTERNAL: { label: '기관 대기', tone: 'neutral', action: '진행 확인' },
  COMPLETED: { label: '완료', tone: 'primary', action: '완료 확인' },
  CANCELLED: { label: '취소', tone: 'neutral', action: '취소 확인' },
}

const EXPIRY_CATEGORY_LABEL: Record<UpcomingExpiryCategory, string> = {
  STAY_EXPIRY: '체류기간 만료',
  CONTRACT_END: '근로계약 종료',
  EMPLOYMENT_PERMIT_END: '고용허가 종료',
  EMPLOYMENT_ACTIVITY_END: '취업활동기간 종료',
  DOCUMENT_EXPIRY: '서류 만료',
}

function getUrgency(dueDate: string | null): WorkItemUrgency {
  const days = daysUntil(dueDate)
  if (days !== null && days <= 0) return 'critical'
  if (days !== null && days <= 7) return 'warning'
  if (days !== null && days <= 30) return 'info'
  return 'neutral'
}

export function buildDashboardMetrics(counts: DashboardSummaryCountsResponse): DashboardMetric[] {
  return [
    {
      id: 'pending-approval',
      label: '승인 대기',
      value: counts.pending_approval,
      iconSrc: metricApprovalIcon,
      tone: 'warning',
    },
    {
      id: 'due-today',
      label: '오늘 마감',
      value: counts.due_today,
      iconSrc: metricDueIcon,
      tone: 'info',
    },
    {
      id: 'needs-info',
      label: '정보 보완',
      value: counts.needs_info,
      iconSrc: metricInfoIcon,
      tone: 'critical',
    },
    {
      id: 'worker-response',
      label: '응답 대기',
      value: counts.worker_response,
      iconSrc: metricResponseIcon,
      tone: 'success',
    },
  ]
}

export function buildDashboardWorkItems(
  tasks: DashboardTaskSummaryResponse[],
): DashboardWorkItem[] {
  return tasks.map((task) => {
    const presentation = STATUS_PRESENTATION[task.status]
    const due = getOperationalDateViewModel('TASK_DUE', task.due_date)
    return {
      id: task.task_id,
      title: task.title,
      status: presentation.label,
      statusTone: presentation.tone,
      schedule: due.relative ?? '기한 미정',
      nextAction: presentation.action,
      urgency: getUrgency(task.due_date),
    }
  })
}

export function buildPriorityApproval(
  tasks: DashboardTaskSummaryResponse[],
): DashboardPriorityApproval | null {
  const task = tasks.find((item) => item.status === 'READY_FOR_REVIEW')
  if (!task) return null

  const due = getOperationalDateViewModel('TASK_DUE', task.due_date)
  return {
    id: task.task_id,
    title: task.title,
    meta: `${due.relative ?? '기한 미정'} · 승인 대기`,
    note: 'Server가 오늘 우선 확인할 승인 업무로 정리했습니다.',
    requestedLabel: due.relative ?? due.display,
  }
}

function mapRecommendation(
  item: DashboardRecommendationItemResponse,
  description?: string,
): DashboardAgentItem {
  return { id: item.task_id, label: item.title, description }
}

export function buildAgentPrepared(
  recommendations: DashboardRecommendationsResponse,
): DashboardAgentPrepared {
  return {
    connectedCount: recommendations.connected_count,
    prepared: recommendations.prepared.map((item) => mapRecommendation(item)),
    review: recommendations.review.map((item) =>
      mapRecommendation(
        item,
        item.status === 'NEEDS_INFO'
          ? '필수 정보를 보완한 뒤 다시 검토합니다.'
          : '상세 내용을 확인한 뒤 담당자가 결정합니다.',
      ),
    ),
    afterApproval: recommendations.after_approval.map((item) =>
      mapRecommendation(
        item,
        item.status === 'WAITING_WORKER'
          ? '근로자 응답을 기다리고 있습니다.'
          : '외부기관 처리 결과를 기다리고 있습니다.',
      ),
    ),
  }
}

export function buildUpcomingExpiries(
  items: UpcomingExpiryItemResponse[],
): DashboardUpcomingExpiry[] {
  return items.map((item) => {
    const date = getOperationalDateViewModel('DOCUMENT_EXPIRY', item.expiry_date)
    const documentLabel =
      item.category === 'DOCUMENT_EXPIRY' && item.document_type
        ? DOCUMENT_TYPE_LABEL[item.document_type]
        : null
    return {
      workerId: item.worker_id,
      workerName: item.display_name,
      label: documentLabel ? `${documentLabel} 만료` : EXPIRY_CATEGORY_LABEL[item.category],
      dateLabel: date.relative ?? date.display,
      urgency: getUrgency(item.expiry_date),
    }
  })
}
