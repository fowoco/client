// TODO(backend): GET /api/work-items/:id -> 아래 상수 전체 대체

export const CASE_HEADER = {
  title: '응웬반A 체류연장 준비',
  badges: ['승인 대기', 'HR 직접 요청'],
  meta: 'D-12 · 담당 김경민 · 체류 · 연결 근로자 1명 · 출입국 관련 기관',
}

export const CASE_TABS = ['현재 단계', '체크리스트', '문서', '소통', '활동이력']

export const AGENT_SUMMARY = {
  headline: '여권 사본 요청문을 준비했습니다.',
  body: '승인이 완료되면 72시간 보안 링크가 활성화됩니다. 실제 전달은 HR이 직접 수행합니다.',
  actionLabel: '다음 행동 · 승인 요청',
}

export const CONTEXT_ACCESS = {
  label: '관련 Context',
  rows: [
    { label: '근거', value: 4 },
    { label: '문서', value: 3 },
    { label: '활동', value: 8 },
  ],
}

export type StepStatus = 'done' | 'pending' | 'locked' | 'waiting'

export interface CaseStep {
  no: number
  title: string
  actor: string
  status: StepStatus
  statusLabel: string
}

export const CASE_STEPS: CaseStep[] = [
  { no: 1, title: '체류만료일과 대상 확인', actor: 'Agent 준비', status: 'done', statusLabel: '완료' },
  { no: 2, title: '보유서류와 필요서류 비교', actor: 'Agent 준비', status: 'done', statusLabel: '완료' },
  {
    no: 3,
    title: '근로자 안내문 검토',
    actor: 'HR 확인',
    status: 'pending',
    statusLabel: '승인 대기',
  },
  { no: 4, title: '보안 링크 전달', actor: 'HR 직접 실행', status: 'locked', statusLabel: '잠김' },
  {
    no: 5,
    title: '서류 회수와 외부 처리 기록',
    actor: '근로자·HR',
    status: 'waiting',
    statusLabel: '대기',
  },
]

export const COMPLETION_GATES = {
  description: '모든 필수 단계와 업무 유형별 증빙을 확인합니다.',
  rows: [
    { label: '승인', value: '대기', tone: 'warning' as const },
    { label: '필수 체크리스트', value: '3 / 5', tone: 'warning' as const },
    { label: '완료 증빙', value: '접수번호 필요', tone: 'critical' as const },
    { label: '담당자 직접 처리', value: '미확인', tone: 'critical' as const },
  ],
  blocked: '완료 처리 불가 · 승인과 증빙 필요',
}

export const ACTION_DOCK = {
  nextStep: '다음 단계 · 안내문 승인 요청',
  draftSaveLabel: '초안 저장',
  approveLabel: '승인 요청',
  footnote: '승인 전에는 근로자 전달과 완료 처리가 차단됩니다. Agent는 승인자가 될 수 없습니다.',
}
