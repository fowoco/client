import type { StatusTone } from '../components/ui/StatusLabel/StatusLabel'
import type { TaskSource, TaskStatus, TaskType } from '../api/tasks'

// fowoco/server TaskStatus(8종) -> 화면 표시 매핑표. #153 완료 조건에 따른 문서화.
// 데모 데이터의 3버킷(pending/waiting-response/other) 대신 실제 상태를 그대로 보여준다.
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  DRAFT: '초안',
  NEEDS_INFO: '정보 부족',
  READY_FOR_REVIEW: '검토 필요',
  APPROVED: '승인됨',
  WAITING_WORKER: '근로자 응답 대기',
  WAITING_EXTERNAL: '외부기관 대기',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
}

export const TASK_STATUS_TONE: Record<TaskStatus, StatusTone> = {
  DRAFT: 'neutral',
  NEEDS_INFO: 'critical',
  READY_FOR_REVIEW: 'warning',
  APPROVED: 'success',
  WAITING_WORKER: 'warning',
  WAITING_EXTERNAL: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
}

// Agent가 생성한 "다음 행동" 문구 자리 — 실제 Agent 추천 API가 없어 상태별 고정 문구로 대체한다.
export const TASK_STATUS_NEXT_ACTION: Record<TaskStatus, string> = {
  DRAFT: '다음 · 작성 계속',
  NEEDS_INFO: '다음 · 정보 보완',
  READY_FOR_REVIEW: '다음 · 검토',
  APPROVED: '다음 · 완료 처리',
  WAITING_WORKER: '다음 · 응답 확인',
  WAITING_EXTERNAL: '다음 · 진행 확인',
  COMPLETED: '완료됨',
  CANCELLED: '취소됨',
}

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  RECONTRACT: '재계약',
  EMPLOYMENT_PERIOD_EXTENSION: '고용기간 연장',
  STAY_PERIOD_EXTENSION: '체류기간 연장',
  DOCUMENT_REQUEST: '서류 요청',
  WORKER_ONBOARDING: '신규 근로자 등록',
  PAYROLL_EXPLANATION: '급여명세서 설명',
  EMPLOYMENT_CHANGE: '고용변동 신고',
  WORK_INSTRUCTION: '업무·근무일정 안내',
}

export const TASK_SOURCE_LABEL: Record<TaskSource, string> = {
  MANUAL: 'HR 직접 요청',
  SYSTEM_DDAY: '시스템 자동 생성',
  AI_CANDIDATE: 'Agent 제안',
}
