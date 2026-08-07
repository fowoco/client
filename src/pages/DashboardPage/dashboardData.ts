import type { TaskStatus, TaskSummaryResponse } from '../../api/tasks'
import type {
  WorkItemStatusTone,
  WorkItemUrgency,
} from '../../components/ui/WorkItemRow/WorkItemRow'
import { getOperationalDateViewModel } from '../../view-models/dateViewModel'
import { daysUntil } from '../../utils/urgency'
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

function isOpenTask(task: TaskSummaryResponse) {
  return task.status !== 'COMPLETED' && task.status !== 'CANCELLED'
}

function compareDueDate(a: TaskSummaryResponse, b: TaskSummaryResponse) {
  if (!a.due_date && !b.due_date) return a.updated_at.localeCompare(b.updated_at)
  if (!a.due_date) return 1
  if (!b.due_date) return -1
  return a.due_date.localeCompare(b.due_date)
}

function getUrgency(dueDate: string | null): WorkItemUrgency {
  const days = daysUntil(dueDate)
  if (days !== null && days <= 0) return 'critical'
  if (days !== null && days <= 7) return 'warning'
  if (days !== null && days <= 30) return 'info'
  return 'neutral'
}

function getRequestedLabel(updatedAt: string, now = new Date()) {
  const elapsed = Math.max(0, now.getTime() - new Date(updatedAt).getTime())
  const hours = Math.floor(elapsed / (60 * 60 * 1000))
  if (hours < 1) return '방금 전'
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export function buildDashboardMetrics(tasks: TaskSummaryResponse[]): DashboardMetric[] {
  const openTasks = tasks.filter(isOpenTask)
  return [
    {
      id: 'pending-approval',
      label: '승인 대기',
      value: openTasks.filter((task) => task.status === 'READY_FOR_REVIEW').length,
      iconSrc: metricApprovalIcon,
      tone: 'warning',
    },
    {
      id: 'due-today',
      label: '오늘 마감',
      value: openTasks.filter((task) => daysUntil(task.due_date) === 0).length,
      iconSrc: metricDueIcon,
      tone: 'info',
    },
    {
      id: 'needs-info',
      label: '정보 보완',
      value: openTasks.filter((task) => task.status === 'NEEDS_INFO').length,
      iconSrc: metricInfoIcon,
      tone: 'critical',
    },
    {
      id: 'worker-response',
      label: '응답 대기',
      value: openTasks.filter((task) => task.status === 'WAITING_WORKER').length,
      iconSrc: metricResponseIcon,
      tone: 'success',
    },
  ]
}

export function buildDashboardWorkItems(tasks: TaskSummaryResponse[]): DashboardWorkItem[] {
  return tasks
    .filter(isOpenTask)
    .sort(compareDueDate)
    .slice(0, 5)
    .map((task) => {
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
  tasks: TaskSummaryResponse[],
  now = new Date(),
): DashboardPriorityApproval | null {
  const task = tasks
    .filter((item) => item.status === 'READY_FOR_REVIEW')
    .sort(compareDueDate)[0]
  if (!task) return null

  const due = getOperationalDateViewModel('TASK_DUE', task.due_date)
  return {
    id: task.task_id,
    title: task.title,
    meta: `${due.relative ?? '기한 미정'} · 승인 대기`,
    note: 'Task API에서 담당자 검토가 필요한 상태로 확인됐습니다.',
    requestedLabel: getRequestedLabel(task.updated_at, now),
  }
}

export function buildAgentPrepared(tasks: TaskSummaryResponse[]): DashboardAgentPrepared {
  const openTasks = tasks.filter(isOpenTask)
  const prepared = openTasks
    .filter((task) => task.source === 'AI_CANDIDATE' && task.status === 'DRAFT')
    .slice(0, 4)
    .map((task) => ({ id: task.task_id, label: task.title }))
  const review = openTasks
    .filter((task) => task.status === 'NEEDS_INFO' || task.status === 'READY_FOR_REVIEW')
    .slice(0, 4)
    .map((task) => ({
      id: task.task_id,
      label: task.title,
      description:
        task.status === 'NEEDS_INFO'
          ? '필수 정보를 보완한 뒤 다시 검토합니다.'
          : '상세 내용을 확인한 뒤 담당자가 결정합니다.',
    }))
  const afterApproval = openTasks
    .filter((task) => task.status === 'WAITING_WORKER' || task.status === 'WAITING_EXTERNAL')
    .slice(0, 4)
    .map((task) => ({
      id: task.task_id,
      label: task.title,
      description:
        task.status === 'WAITING_WORKER'
          ? '근로자 응답을 기다리고 있습니다.'
          : '외부기관 처리 결과를 기다리고 있습니다.',
    }))

  return { connectedCount: openTasks.length, prepared, review, afterApproval }
}
