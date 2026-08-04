import type { WorkItemUrgency } from '../../components/ui/WorkItemRow/WorkItemRow'
import { EXAMPLE_PROMPTS } from '../CreateWorkPage/createWorkData'

// TODO(backend): 이 파일의 상수는 데모용 목데이터. 실제 연동 시 아래 엔드포인트로 대체
// - GET /api/dashboard/work-items -> TODAY_WORK_ITEMS
// - GET /api/dashboard/top-approval -> TOP_APPROVAL
// - GET /api/dashboard/metrics -> METRIC_STRIP
// - GET /api/dashboard/agent-progress -> AGENT_PREPARED

export interface WorkItem {
  id: string
  title: string
  meta: string
  nextAction: string
  urgency: WorkItemUrgency
}

// Figma HOME-001(node 1291:209) "오늘의 우선 업무" 목록.
export const TODAY_WORK_ITEMS: WorkItem[] = [
  {
    id: 'WI-1',
    title: '응웬반A 체류연장 요청문',
    meta: 'D-2 · 담당 김민지',
    nextAction: '승인 검토',
    urgency: 'critical',
  },
  {
    id: 'WI-2',
    title: '외국인등록증 사본 제출',
    meta: '오늘 마감 · 담당 이지연',
    nextAction: '요청 현황',
    urgency: 'warning',
  },
  {
    id: 'WI-3',
    title: '7월 외부기관 제출자료',
    meta: '이번 주 · 담당 박서준',
    nextAction: '증빙 등록',
    urgency: 'neutral',
  },
]

// Figma HOME-001의 "먼저 검토할 승인 업무" 카드 — 우선순위가 가장 높은 승인 1건을 크게 보여준다.
export const TOP_APPROVAL = {
  requestedLabel: '요청 · 3시간 전',
  title: '응웬반A 체류연장 요청문 승인',
  meta: '응웬반A · D-2 · 담당 김민지',
  note: '승인을 완료하면 근로자 안내 단계가 활성화됩니다.',
  actionLabel: '승인 검토',
}

export type MetricIconKey = 'check' | 'calendar' | 'warning' | 'response'

export interface DashboardMetric {
  id: string
  label: string
  value: number
  icon: MetricIconKey
}

export const METRIC_STRIP: DashboardMetric[] = [
  { id: 'pending-approval', label: '승인 대기', value: 7, icon: 'check' },
  { id: 'due-today', label: '오늘 마감', value: 6, icon: 'calendar' },
  { id: 'needs-info', label: '정보 보완', value: 1, icon: 'warning' },
  { id: 'worker-response', label: '근로자 응답', value: 8, icon: 'response' },
]

// Figma HOME-001의 상단 "Agent 업무 요청" 입력 박스 안내문·예시 태그.
export const COMMAND_BAR = {
  title: 'Agent 업무 요청',
  placeholder: '처리할 업무를 자연어로 입력해 주세요. 예: 응웬반A의 체류기간 연장 준비',
}

// Figma HOME-001(node 1291:209)의 자연어 입력 프롬프트 칩은 CreateWorkPage의 예시 칩과 동일 문구.
export const AI_REQUEST_PROMPT_CHIPS = EXAMPLE_PROMPTS

export interface AgentPreparedItem {
  id: string
  label: string
}

export interface AgentPendingItem {
  id: string
  label: string
  note: string
}

// Figma HOME-001 우측 "Agent가 준비한 내용" 패널.
export const AGENT_PREPARED = {
  summary: '준비 완료 4건 · HR 확인 필요 2건',
  note: 'Agent는 초안까지만 준비하며, 검토와 승인은 담당자가 수행합니다.',
  readyLabel: '준비 완료 · 4건',
  ready: [
    { id: 'ready-1', label: '필요 문서 5개 확인' },
    { id: 'ready-2', label: '체류연장 요청문 초안' },
    { id: 'ready-3', label: '기존 계약·체류 정보 연결' },
    { id: 'ready-4', label: '유사 업무 중복 여부 확인' },
  ] as AgentPreparedItem[],
  needsInfoLabel: 'HR 확인 필요 · 2건',
  needsInfo: [
    { id: 'needs-1', label: '여권 만료일 확인', note: '여권 원본과 만료일을 확인한 뒤 승인합니다.' },
    { id: 'needs-2', label: '추천 마감일·담당자 확인', note: '업무량과 제출 기한을 확인한 뒤 확정합니다.' },
  ] as AgentPendingItem[],
  afterApprovalLabel: '승인 후 진행 · 2건',
  afterApproval: [
    { id: 'after-1', label: '근로자 요청문 확인', note: '승인되면 근로자 요청 확인 단계가 열립니다.' },
    { id: 'after-2', label: '보안 링크 발급 준비', note: '승인 후 담당자가 발급하고 근로자에게 전달합니다.' },
  ] as AgentPendingItem[],
}
