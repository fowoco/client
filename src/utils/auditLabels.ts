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
  FILE_UPLOADED: '파일을 업로드했습니다.',
  FILE_DOWNLOADED: '파일을 내려받았습니다.',
  WORKER_DOCUMENT_FILE_LINKED: '근로자 문서에 파일을 연결했습니다.',
  DOCUMENT_REQUEST_DRAFT_SAVED: '문서 요청 초안을 저장했습니다.',
  AI_RUN_CREATED: 'Agent 업무 분석을 시작했습니다.',
  AI_RUN_ANSWERS_SUBMITTED: 'Agent의 추가 질문에 답변했습니다.',
  AI_RUN_CANDIDATES_DECIDED: 'Agent 업무 후보를 확정했습니다.',
  OUTBOX_MANUAL_RETRY_REQUESTED: '실패한 이벤트의 재처리를 요청했습니다.',
  WORKER_LINK_RESPONSE_SUBMITTED: '근로자가 모바일 링크로 응답했습니다.',
  WORKER_LINK_RESPONSES_REVIEWED: '근로자 응답을 확인했습니다.',
  WORKER_LINK_ACCESSED: '근로자가 모바일 링크를 열었습니다.',
  USER_AGREEMENTS_RECORDED: '사용자 약관 동의를 기록했습니다.',
  PASSWORD_RESET_REQUESTED: '비밀번호 재설정을 요청했습니다.',
  PASSWORD_RESET_COMPLETED: '비밀번호 재설정을 완료했습니다.',
}

export function getAuditActionLabel(action: string): string {
  return AUDIT_ACTION_LABEL[action as AuditAction] ?? `시스템 이벤트(${action})가 기록되었습니다.`
}
