// TODO(backend): GET /api/work-items/draft?requestId= -> UNDERSTOOD_REQUEST, PREPARED_DRAFT, HR_VERIFICATION_FIELDS 대체

export interface ReviewStep {
  no: string
  label: string
}

// Figma REVIEW-001(Docs/Screen Block/REVIEW-001/01~04) 4단계 진행 표시기. 01 요청 확인은
// CreateWorkPage(/tasks/new)에서 보여주고, 02~04는 ReviewWorkPage 내부 위저드에서 보여준다
// — 두 페이지가 이 배열을 함께 쓴다.
export const REVIEW_STEPS: ReviewStep[] = [
  { no: '1', label: '요청 확인' },
  { no: '2', label: '정보 보완' },
  { no: '3', label: '초안 준비' },
  { no: '4', label: '최종 검토' },
]

export const PREPARED_CHECKLIST = [
  '근로자 3명 정보 확인 완료',
  '필요서류 5개 대조',
  '신규 근로자 입사 준비 절차 확인',
  '업무 초안 작성 완료',
]

export const DRAFT_REASONS = [
  '입사일 기준 이번 주 마감',
  '입사·보험 절차 v2.1 적용',
  '베트남 국적 대상 확인',
  '이전 제출 기록 확인',
]

export const UNDERSTOOD_REQUEST = {
  purpose: '입사 준비',
  domain: '입사·보험',
  procedure: '신규 근로자 입사 준비 v2.1',
}

export interface HrVerificationField {
  key: string
  label: string
}

// 02 정보 보완에서 HR이 직접 채워야 하는 정보 — Agent가 대신 판단하지 않는다.
export const HR_VERIFICATION_FIELDS: HrVerificationField[] = [
  { key: 'passportExpiry', label: '여권 유효기간' },
  { key: 'permitPeriod', label: '고용허가기간' },
  { key: 'activityPeriod', label: '취업활동기간' },
]

export const TARGET_OPTIONS = ['베트남 근로자 3명', '응웬반A', '담당자 직접 지정']

export const PREPARED_DRAFT = {
  title: ['베트남 근로자 3명', '입사·보험 자료 준비'],
  // null이면 Agent가 대상을 특정하지 못한 상태 — 드롭다운으로 HR이 직접 선택한다.
  target: '베트남 근로자 3명' as string | null,
  dueLabel: '금요일',
  assignee: '김경민',
  country: '베트남',
  approvalStatus: '승인 대기',
  completionEvidence: '서류 상태 기록',
  requiredStepCount: 5,
}

export const TASK_CREATION_SUMMARY = {
  title: '베트남 근로자 3명 입사·보험 자료 준비',
  procedure: '신규 근로자 입사 준비 v2.1',
}

export const APPROVAL_SUMMARY = {
  approver: '김경민',
  pendingNote: '작성자 승인 요청 후 승인권자가 최종 승인합니다.',
  approvedNote: '업무함에서 진행 상황을 확인할 수 있습니다.',
}
