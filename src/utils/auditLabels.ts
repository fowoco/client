import type { AgentSource } from '../components/ui/AgentSourceLabel/AgentSourceLabel'
import type { ActorType, AuditAction } from '../api/audit'

// fowoco/server ActorType(4종) -> AgentSourceLabel 매핑. WORKER_LINK(근로자 모바일 링크 응답)는
// 기존 데모 4분류(rule/data/draft/review)에 없어 'worker' 변형을 새로 추가했다.
// 반대로 데모의 'data'(보유 데이터)에 대응하는 실제 ActorType은 없다.
export const ACTOR_TYPE_TO_AGENT_SOURCE: Record<ActorType, AgentSource> = {
  SYSTEM_RULE: 'rule',
  AI_AGENT: 'draft',
  HR_USER: 'review',
  WORKER_LINK: 'worker',
}

// change_summary가 비어 있을 때 보여줄 기본 문구.
export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  TASK_CREATED: '업무를 생성했습니다.',
  TASK_UPDATED: '업무 내용을 수정했습니다.',
  CHECKLIST_ITEM_UPDATED: '체크리스트를 수정했습니다.',
  TASK_CANCELLED: '업무를 취소했습니다.',
  APPROVAL_REQUESTED: '승인을 요청했습니다.',
  TASK_APPROVED: '승인했습니다.',
  TASK_REJECTED: '반려했습니다.',
  APPROVAL_INVALIDATED: '내용 변경으로 재승인이 필요합니다.',
  EXTERNAL_SUBMISSION_RECORDED: '외부기관 제출을 기록했습니다.',
  EVIDENCE_RECORDED: '완료 증빙을 기록했습니다.',
  TASK_COMPLETED: '업무를 완료 처리했습니다.',
}
