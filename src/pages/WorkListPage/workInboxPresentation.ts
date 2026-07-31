import type { TaskStatus } from '../../api/tasks'
import type { StatusTone } from '../../components/ui/StatusLabel/StatusLabel'
import { TASK_STATUS_LABEL, TASK_STATUS_TONE, TASK_TYPE_LABEL } from '../../utils/taskStatus'
import { daysUntil } from '../../utils/urgency'
import type { WorkInboxTask } from './workInboxModel'

const REVIEW_ACTION_LABEL: Record<TaskStatus, string> = {
  DRAFT: '초안 검토',
  NEEDS_INFO: '정보 확인',
  READY_FOR_REVIEW: '검토하기',
  APPROVED: '실행 확인',
  WAITING_WORKER: '대기 확인',
  WAITING_EXTERNAL: '진행 확인',
  COMPLETED: '완료 확인',
  CANCELLED: '취소 확인',
}

const DECISION_SUMMARY: Record<TaskStatus, string> = {
  DRAFT: '준비된 초안을 검토하면 다음 단계로 진행할 수 있습니다.',
  NEEDS_INFO: '필수 정보를 보완해야 업무를 다시 진행할 수 있습니다.',
  READY_FOR_REVIEW: '담당자 검토와 결정이 필요한 업무입니다.',
  APPROVED: '승인이 완료되어 다음 실행 단계를 확인할 수 있습니다.',
  WAITING_WORKER: '근로자 응답을 기다리고 있습니다.',
  WAITING_EXTERNAL: '외부기관의 처리 결과를 기다리고 있습니다.',
  COMPLETED: '필요한 절차가 모두 완료된 업무입니다.',
  CANCELLED: '취소된 업무입니다. 상세 화면에서 사유를 확인해 주세요.',
}

export interface DuePresentation {
  label: string
  tone: StatusTone
}

export function getDuePresentation(dueDate: string | null): DuePresentation {
  const dueDays = daysUntil(dueDate)
  if (dueDays === null) return { label: '기한 미정', tone: 'neutral' }
  if (dueDays < 0) return { label: `D+${Math.abs(dueDays)}`, tone: 'critical' }
  if (dueDays === 0) return { label: '오늘', tone: 'critical' }
  if (dueDays <= 7) return { label: `D-${dueDays}`, tone: 'critical' }
  if (dueDays <= 30) return { label: `D-${dueDays}`, tone: 'warning' }
  return { label: `D-${dueDays}`, tone: 'neutral' }
}

export function getTaskStatusPresentation(status: TaskStatus): {
  label: string
  tone: StatusTone
} {
  return {
    label: TASK_STATUS_LABEL[status],
    tone: TASK_STATUS_TONE[status],
  }
}

export function getReviewActionLabel(status: TaskStatus): string {
  return REVIEW_ACTION_LABEL[status]
}

export function getDecisionSummary(status: TaskStatus): string {
  return DECISION_SUMMARY[status]
}

export function getWorkflowLabel(item: WorkInboxTask): string {
  return item.workflowName ?? TASK_TYPE_LABEL[item.task.task_type]
}

export function isReviewTask(status: TaskStatus): boolean {
  return status !== 'COMPLETED' && status !== 'CANCELLED'
}
