// TODO(backend): 이 파일 전체는 Figma PWF3/Screen/REVIEW-001/01~04 목업의 목데이터다.
// GET /api/work-items/draft?requestId= 등 실제 API 연동 시 아래 목데이터를 대체한다.

export interface ReviewStep {
  no: string
  label: string
}

// Figma REVIEW-001(PWF3/Screen/REVIEW-001/01~04) 4단계 진행 표시기. 01 요청 확인은
// CreateWorkPage(/tasks/new)에서 보여주고, 02~04는 ReviewWorkPage 내부 위저드에서 보여준다
// — 두 페이지가 이 배열을 함께 쓴다.
export const REVIEW_STEPS: ReviewStep[] = [
  { no: '1', label: '요청 확인' },
  { no: '2', label: '정보 보완' },
  { no: '3', label: '초안 작성' },
  { no: '4', label: '최종 검토' },
]

export type PillTone = 'neutral' | 'brand' | 'green' | 'amber' | 'red'

// === 02 정보 보완 ===

export interface ResolutionRow {
  owner: string
  ownerTone: PillTone
  field: string
  blocked: string
  method: string
  state: string
  stateTone: PillTone
}

export const RESOLUTION_ROWS: ResolutionRow[] = [
  {
    owner: '근로자 요청',
    ownerTone: 'brand',
    field: '여권 사본 · 만료일',
    blocked: '차단 해제',
    method: '응우옌 반 A · 보안 링크',
    state: '반영 완료',
    stateTone: 'brand',
  },
  {
    owner: '선행 업무 결과',
    ownerTone: 'neutral',
    field: '서명된 근로계약서',
    blocked: '후속 차단',
    method: '재계약 조건 확인 결과 연결',
    state: '선행 대기',
    stateTone: 'amber',
  },
]

// HR이 직접 입력해야 하는 정보 — Agent가 대신 판단하지 않는다.
export interface HrVerificationField {
  key: string
  label: string
}

export const HR_VERIFICATION_FIELDS: HrVerificationField[] = [
  { key: 'passportExpiry', label: '여권 유효기간' },
  { key: 'permitPeriod', label: '고용허가기간' },
  { key: 'activityPeriod', label: '취업활동기간' },
]

export const RESOLUTION_MATRIX_META = '생성 대상 필수정보 9/9 · 다음 처리 절차의 선행정보 1건 대기'
export const RESOLUTION_MATRIX_FOOTNOTE =
  '근로자 응답은 후보값이며 HR이 반영하기 전에는 기본정보와 초안에 확정되지 않습니다.'

export const SECURE_LINK = {
  status: '완료',
  title: '응우옌 반 A · 여권 사본 요청',
  meta: 'LINK-2026-081 · 68시간 남음',
  note: '재발급 시 기존 링크 자동 폐기',
}

export const WORKER_CANDIDATE = {
  sourceLabel: '근로자 제출',
  fieldLabel: '여권 만료일',
  value: '2026.08.07',
  note: '여권 사본과 입력값을 함께 확인',
  reflectedBy: '김민지 HR · 오늘 10:24 반영',
}

export const GENERATION_GATE = {
  readyCount: 2,
  blockedCount: 1,
  note: '필수정보가 남아 있으면 초안을 생성할 수 없습니다.',
}

// === 03 초안 작성 ===

export type DraftDocumentStatus = 'ready' | 'blocked' | 'failed'

export interface DraftDocument {
  title: string
  meta: string
  status: DraftDocumentStatus
  statusLabel: string
  actionLabel: string
}

export const DRAFT_DOCUMENTS: DraftDocument[] = [
  {
    title: '표준근로계약서',
    meta: 'PDF 검토본 준비 · 원본 형식 HWPX',
    status: 'ready',
    statusLabel: '초안 대기',
    actionLabel: '초안 검토',
  },
  {
    title: '근로자 서류 요청 안내문',
    meta: '쉬운 한국어 안내 · 제출기한 8월 7일',
    status: 'ready',
    statusLabel: '초안 대기',
    actionLabel: '초안 검토',
  },
  {
    title: '취업활동기간 연장신청서',
    meta: '서명된 계약서 등록 후 생성',
    status: 'blocked',
    statusLabel: '선행 대기',
    actionLabel: '조건 보기 →',
  },
  {
    title: '고용센터 제출 체크리스트',
    meta: '공식 서식 버전 확인 실패',
    status: 'failed',
    statusLabel: '생성 실패',
    actionLabel: '다시 생성',
  },
]

export const LEAVE_WARNING = {
  title: '화면 이탈 안내',
  body: '생성 중인 항목이 있으면 결과를 저장한 뒤 이동합니다. 실패한 문서는 입력값을 유지한 채 다시 생성할 수 있습니다.',
}

export const SOURCE_COUNTS = [
  { label: '기존 등록 정보', value: '18개' },
  { label: 'HR 입력', value: '4개' },
  { label: '근로자 제출', value: '1개' },
]

export const DOCUMENT_STATE_LEGEND = [
  '초안 검토 대기 · PDF 준비',
  '선행 단계 필요 · 조건 미충족',
  '생성 실패 · 입력값 유지 후 재시도',
]

export const NEXT_WORKFLOW_GATE = {
  title: '체류기간 연장 준비',
  status: '선행 대기',
  note: '서명된 근로계약서가 문서함에 등록되면 체류기간 연장 준비가 열립니다.',
}

export const GENERATION_BOUNDARY_NOTE = 'Agent는 문서를 생성·변환하지만 승인과 외부 제출은 수행하지 않습니다.'

// === 04 최종 검토 ===

export const DOCUMENT_TABS = ['표준근로계약서', '서류 요청 안내문', '연장신청서 · 선행 필요']

export const PDF_PREVIEW = {
  title: '표준근로계약서',
  subtitle: '고용노동부 표준서식 · 검토본',
  rows: [
    { label: '근로자 성명', value: '응우옌 반 A' },
    { label: '계약 기간', value: '2026.10.01 — 2027.09.29', highlighted: true },
    { label: '근무 장소', value: 'FOWOCO 데모 사업장' },
    { label: '담당 업무', value: '제조 · 조립 라인' },
    { label: '임금 지급일', value: '매월 10일' },
  ],
  footer: '검토용 PDF · 승인 전',
  disclaimer: '원본 HWP/HWPX는 보존되며, 이 화면은 서버 변환 PDF 검토본입니다.',
}

export const TEMPLATE_METADATA = {
  title: '표준근로계약서',
  meta: '공식 표준근로계약서 · 버전 2026.1 · 최종 확인 2026.07.30',
  roleLabel: '작성자',
}

export interface StructuredField {
  label: string
  value: string
  source: string
  sourceTone: PillTone
  note: string
  noteTone: PillTone
}

export const STRUCTURED_FIELDS: StructuredField[] = [
  {
    label: '근로자 성명',
    value: '응우옌 반 A',
    source: '기존 등록 정보',
    sourceTone: 'neutral',
    note: '핵심값 보존 완료',
    noteTone: 'green',
  },
  {
    label: '계약 종료일',
    value: '2026.09.30 → 2027.09.29',
    source: 'HR 입력',
    sourceTone: 'brand',
    note: '변경 1건',
    noteTone: 'brand',
  },
  {
    label: '여권 만료일',
    value: '2026.08.07',
    source: '근로자 제출',
    sourceTone: 'amber',
    note: '유효기간 경고',
    noteTone: 'neutral',
  },
  {
    label: '근무 장소',
    value: '기존 DB 값 유지',
    source: '기존 등록 정보',
    sourceTone: 'neutral',
    note: '핵심값 보존 완료',
    noteTone: 'green',
  },
]

export const VALIDATION_SUMMARY = {
  summary: '핵심값 보존 7/7 · 오류 0 · 경고 1',
  note: '여권 만료일이 제출기한과 가까워 최종 확인이 필요합니다.',
  backLinkLabel: '누락 · 충돌 발생 시 정보 보완으로 돌아가기 →',
}

export const APPROVAL_SUMMARY = {
  approver: '김민지',
  pendingTitle: '작성자 검토가 완료되면 승인 요청을 보낼 수 있습니다.',
  pendingNote: '승인권자는 같은 위치에서 ‘승인하고 문서함에 저장’을 실행합니다.',
  approvedNote: '업무함에서 진행 상황을 확인할 수 있습니다.',
}
