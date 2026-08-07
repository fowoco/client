// TODO(backend): 이 파일 전체는 Figma PWF3/Screen/REVIEW-001/01 Request Input 목업의 목데이터다.
// POST /api/work-items/analyze 등 실제 API 연동 시 아래 목데이터를 대체한다.

export const DEFAULT_ORIGINAL_REQUEST = '응우옌 반 A의 재계약과 연장 준비를 진행해줘.\n여권 사본이 없으면 8월 7일까지 제출하도록 안내해줘.'

export const SCENARIO_STATUS_LABEL = '업무 건 · 재계약 · 연장 준비'

export const UNDERSTOOD_WORK = {
  title: '재계약 및 연장 준비',
  note: '상위 업무 건에 지금 할 일 3개 연결',
}

export type WorkflowTaskStatus = 'current' | 'pending' | 'blocked'

export interface WorkflowTask {
  title: string
  meta: string
  status: WorkflowTaskStatus
  statusLabel: string
}

export const WORKFLOW_TASKS: WorkflowTask[] = [
  {
    title: '재계약 조건 확인',
    meta: '현재 처리 절차 · 지금 시작 가능',
    status: 'current',
    statusLabel: '현재 처리 절차',
  },
  {
    title: '여권 사본 요청',
    meta: '8월 7일까지 · 보안 링크 준비',
    status: 'pending',
    statusLabel: '정보 보완',
  },
  {
    title: '취업활동기간 연장 준비',
    meta: '서명된 계약서 등록 후 시작',
    status: 'blocked',
    statusLabel: '선행 대기',
  },
]

export const COMPOUND_REQUEST_NOTE = '복합 요청은 거절하지 않고 하나의 업무 건 아래 지금 할 일로 나눕니다.'

export const TARGET_CASE = {
  workerName: '응우옌 반 A',
  meta: '베트남 · E-9 · 담당 김하나',
  progress: '재계약 · 연장 준비 · 진행 4/12',
}

export type InfoSourceTone = 'neutral' | 'brand' | 'amber'

export interface RequiredInfoRow {
  label: string
  value: string
  source: string
  sourceTone: InfoSourceTone
}

export const REQUIRED_INFO_COUNT = '필수정보 7/9'

export const REQUIRED_INFO_ROWS: RequiredInfoRow[] = [
  { label: '근로자', value: '응우옌 반 A', source: '기존 등록 정보', sourceTone: 'neutral' },
  { label: '계속 고용 의사', value: '계속 고용', source: 'HR 입력', sourceTone: 'brand' },
  { label: '여권 사본', value: '보유 없음', source: '기존 등록 정보', sourceTone: 'neutral' },
  { label: '제출 기한', value: '2026.08.07', source: 'HR 입력', sourceTone: 'brand' },
  { label: '여권 만료일', value: '여권 사본 확인 필요', source: '근로자 제출', sourceTone: 'amber' },
]

export const AGENT_SCOPE_NOTE = '처리 절차와 값의 출처를 제안하며, 실제 지금 할 일 등록은 HR이 확정합니다.'

export const ACTION_DOCK = {
  title: '상위 업무 건에 지금 할 일 후보 3개를 준비했습니다.',
  subtitle: '내부 코드와 분류 근거는 상세 명세에서만 확인합니다.',
}
