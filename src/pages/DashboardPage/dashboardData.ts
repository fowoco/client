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

export const AI_REQUEST_PROMPT_CHIPS = [
  '체류기간 연장',
  '누락 문서 확인',
  '승인 대기 정리',
  '근로자 요청',
]

export interface DashboardMetric {
  id: string
  label: string
  value: number
  href: string
}

export interface DashboardWorkItem {
  id: string
  workerName: string | null
  title: string
  status: string
  statusTone: WorkItemStatusTone
  deadline: string
  nextActor: string
  nextAction: string
  urgency: WorkItemUrgency
  group: 'actionable' | 'waiting' | 'closed'
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
  {
    label: string
    tone: WorkItemStatusTone
    actor: string
    action: string
    group: DashboardWorkItem['group']
  }
> = {
  DRAFT: {
    label: '서류 대기',
    tone: 'neutral',
    actor: '담당자',
    action: '초안 검토',
    group: 'actionable',
  },
  NEEDS_INFO: {
    label: '정보 보완',
    tone: 'warning',
    actor: '담당자',
    action: '정보 확인',
    group: 'actionable',
  },
  READY_FOR_REVIEW: {
    label: '승인 대기',
    tone: 'warning',
    actor: '담당자',
    action: '승인 검토',
    group: 'actionable',
  },
  APPROVED: {
    label: '승인 완료',
    tone: 'primary',
    actor: '담당자',
    action: '실행 확인',
    group: 'actionable',
  },
  WAITING_WORKER: {
    label: '요청 전송',
    tone: 'primary',
    actor: '근로자',
    action: '요청 현황',
    group: 'waiting',
  },
  WAITING_EXTERNAL: {
    label: '기관 대기',
    tone: 'neutral',
    actor: '외부기관',
    action: '진행 확인',
    group: 'waiting',
  },
  COMPLETED: {
    label: '완료',
    tone: 'primary',
    actor: '완료',
    action: '결과 확인',
    group: 'closed',
  },
  CANCELLED: {
    label: '취소',
    tone: 'neutral',
    actor: '없음',
    action: '취소 확인',
    group: 'closed',
  },
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
      href: '/tasks?focus=pending-approval',
    },
    {
      id: 'due-today',
      label: '오늘 마감',
      value: counts.due_today,
      href: '/tasks?focus=due-today',
    },
    {
      id: 'needs-info',
      label: '정보 보완',
      value: counts.needs_info,
      href: '/tasks?focus=needs-info',
    },
    {
      id: 'worker-response',
      label: '응답 대기',
      value: counts.worker_response,
      href: '/tasks?focus=worker-response',
    },
  ]
}

export function buildDashboardWorkItems(
  tasks: DashboardTaskSummaryResponse[],
  upcomingExpiries: UpcomingExpiryItemResponse[] = [],
  workers: { worker_id: string; display_name: string }[] = [],
): DashboardWorkItem[] {
  // upcoming_7_days에는 마감 임박 근로자만 있어서 우선 업무의 근로자 이름이 종종
  // 비어 보였다. 전체 근로자 목록을 우선 사용하고, 못 찾으면 upcoming_7_days로 보완한다.
  const workerNameById = new Map([
    ...upcomingExpiries.map((item): [string, string] => [item.worker_id, item.display_name]),
    ...workers.map((worker): [string, string] => [worker.worker_id, worker.display_name]),
  ])

  return tasks.map((task) => {
    const presentation = STATUS_PRESENTATION[task.status]
    const due = getOperationalDateViewModel('TASK_DUE', task.due_date)
    return {
      id: task.task_id,
      workerName: workerNameById.get(task.worker_id) ?? null,
      title: task.title,
      status: presentation.label,
      statusTone: presentation.tone,
      deadline: due.missing ? '처리 기한 미등록' : `처리 기한 ${due.display}`,
      nextActor: presentation.actor,
      nextAction: presentation.action,
      urgency: getUrgency(task.due_date),
      group: presentation.group,
    }
  })
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
