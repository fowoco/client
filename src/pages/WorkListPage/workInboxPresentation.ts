import type { TaskStatus } from '../../api/tasks'
import type { StatusTone } from '../../components/ui/StatusLabel/StatusLabel'
import { TASK_STATUS_LABEL, TASK_STATUS_TONE, TASK_TYPE_LABEL } from '../../utils/taskStatus'
import { getOperationalDateViewModel } from '../../view-models/dateViewModel'
import type { WorkInboxTask } from './workInboxModel'

const REVIEW_ACTION_LABEL: Record<TaskStatus, string> = {
  DRAFT: '초안 검토',
  NEEDS_INFO: '정보 확인',
  READY_FOR_REVIEW: '초안 검토',
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
  const due = getOperationalDateViewModel('TASK_DUE', dueDate)
  return { label: due.relative ?? '기한 미정', tone: due.tone }
}

export function getTaskStatusPresentation(status: TaskStatus): {
  label: string
  tone: StatusTone
} {
  const workInboxLabel: Partial<Record<TaskStatus, string>> = {
    DRAFT: '서류 대기',
    NEEDS_INFO: '처리 필요',
    READY_FOR_REVIEW: '승인 대기',
    WAITING_WORKER: '요청 전송',
  }

  return {
    label: workInboxLabel[status] ?? TASK_STATUS_LABEL[status],
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

export interface ReviewStageLink {
  label: string
  href: string
  // 같은 단계 라벨은 화면 어디에 나오든 같은 색으로 보이도록 고정한다.
  tone: StatusTone
}

// REVIEW-001 4단계(요청 확인/정보 보완/초안 작성/최종 검토) 전체 진입 경로 · 색상.
const REVIEW_STAGE_LINKS: ReviewStageLink[] = [
  { label: '요청 확인', href: '/tasks/new', tone: 'neutral' },
  { label: '정보 보완', href: '/tasks/new/review?step=1', tone: 'warning' },
  { label: '초안 작성', href: '/tasks/new/review?step=2', tone: 'info' },
  { label: '최종 검토', href: '/tasks/new/review?step=3', tone: 'agent' },
]

// TaskStatus를 REVIEW-001 4단계 중 매칭되는 단계로 연결한다. 업무함의 근로자 배지
// 라벨을 요청 확인/정보 보완/초안 작성/최종 검토로 바꿔 보여주고, 그 배지를 클릭하면
// 바로 해당 화면으로 이동시키는 데 쓴다.
const REVIEW_STAGE_LINK: Partial<Record<TaskStatus, ReviewStageLink>> = {
  NEEDS_INFO: REVIEW_STAGE_LINKS[1],
  DRAFT: REVIEW_STAGE_LINKS[2],
  READY_FOR_REVIEW: REVIEW_STAGE_LINKS[3],
}

export function getReviewStageLink(status: TaskStatus): ReviewStageLink {
  return REVIEW_STAGE_LINK[status] ?? REVIEW_STAGE_LINKS[0]
}
