const INTENT_LABELS: Record<string, string> = {
  EXPIRY_RENEWAL: '체류기간 연장',
  STAY_PERIOD_EXTENSION: '체류기간 연장',
  EMPLOYMENT_PERIOD_EXTENSION: '고용기간 연장',
  RECONTRACT: '재계약',
  WORKER_ONBOARDING: '신규 근로자 입사 준비',
  DOCUMENT_REQUEST: '서류 요청',
  WORK_INSTRUCTION: '업무 안내',
  PAYROLL_EXPLANATION: '급여·근태 설명',
}

const SLOT_LABELS: Record<string, string> = {
  due_at: '신청 목표일',
  due_date: '마감일',
  passport_expiry_date: '여권 유효기간',
  stay_expiry_date: '체류 만료일',
  contract_end_date: '근로계약 종료일',
  receipt_number: '접수번호',
}

export function intentLabel(intent: string | null) {
  if (!intent) return '분석 중'
  return INTENT_LABELS[intent] ?? '분류 결과 확인 필요'
}

export function slotLabel(slot: string) {
  return SLOT_LABELS[slot] ?? '추출 정보'
}

export function analysisOutcomeLabel(outcome: string | null) {
  switch (outcome) {
    case 'NEEDS_INFO':
      return '정보 확인 필요'
    case 'REVIEW_REQUIRED':
      return '후보 검토 필요'
    case 'CONTEXT_REQUIRED':
      return 'Context 확인 필요'
    default:
      return '분석 중'
  }
}
