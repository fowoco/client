// TODO(backend): GET /api/work-items/draft?requestId= -> UNDERSTOOD_REQUEST, PREPARED_DRAFT, MISSING_INFO 대체

export const UNDERSTOOD_REQUEST = {
  purpose: '입사 준비',
  domain: '입사·보험',
  procedure: '신규 근로자 입사 준비 v2.1',
  target: '베트남 근로자 3명',
  dueDate: '이번 주 금요일',
}

export const MISSING_INFO = {
  title: '확인할 정보 1개',
  question: '4대보험 가입자료를 어느 기관 기준으로 준비할지 선택해 주세요.',
  placeholder: '보험 관련 기관 선택',
  options: ['국민연금공단', '국민건강보험공단', '근로복지공단'],
  warning: '이 정보가 확인되기 전에는 승인 요청과 외부 전달이 차단됩니다.',
}

export const PREPARED_DRAFT = {
  title: ['베트남 근로자 3명', '입사·보험 자료 준비'],
  rows: [
    { label: '대상', value: '근로자 3명' },
    { label: '기한', value: '금요일' },
    { label: '담당자', value: '김민지' },
    { label: '필수 단계', value: '5개' },
    { label: '승인', value: '필요' },
    { label: '완료 증빙', value: '서류 상태 기록' },
  ],
}
