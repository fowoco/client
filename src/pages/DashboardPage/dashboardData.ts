import metricApprovalIcon from './assets/metric-approval.svg'
import metricDueIcon from './assets/metric-due.svg'
import metricInfoIcon from './assets/metric-info.svg'
import metricResponseIcon from './assets/metric-response.svg'

// TODO(backend): 이 파일의 상수는 Figma HOME-001을 재현하기 위한 Prototype 데이터다.
// Dashboard Projection API가 준비되면 동일한 ViewModel 형태로 응답을 정규화한다.

export type DashboardWorkStatus = '승인대기' | '요청전송' | '서류대기'
export type DashboardWorkTone = 'warning' | 'critical' | 'info'

export interface DashboardWorkItem {
  id: string
  title: string
  status: DashboardWorkStatus
  schedule: string
  assignee?: string
  nextAction: string
  urgency: DashboardWorkTone
}

export const TODAY_WORK_ITEMS: DashboardWorkItem[] = [
  {
    id: 'WI-1',
    title: '응웬반A 체류연장 요청문',
    status: '승인대기',
    schedule: 'D-2',
    assignee: '담당 김민지',
    nextAction: '승인 검토',
    urgency: 'warning',
  },
  {
    id: 'WI-2',
    title: '외국인등록증 사본 제출',
    status: '요청전송',
    schedule: 'D-0',
    nextAction: '요청 현황',
    urgency: 'critical',
  },
  {
    id: 'WI-3',
    title: '7월 외부기관 제출자료',
    status: '서류대기',
    schedule: 'D-3',
    nextAction: '증빙 등록',
    urgency: 'info',
  },
]

export const APPROVAL_QUEUE = {
  blockingCount: 2,
  totalCount: 7,
  oldestValue: '3시간 전',
  title: '응웬반A 체류연장 요청문 승인',
  meta: '응웬반A · D-2 · 담당 김민지',
  note: '승인을 완료하면 근로자 안내 단계가 활성화됩니다.',
}

export const AI_REQUEST_PROMPT_CHIPS = [
  '체류기간 연장',
  '누락 문서 확인',
  '승인 대기 정리',
  '근로자 요청',
]

export type DashboardMetricTone = 'warning' | 'info' | 'critical' | 'success'

export interface DashboardMetric {
  id: string
  label: string
  value: number
  iconSrc: string
  tone: DashboardMetricTone
}

export const METRIC_STRIP: DashboardMetric[] = [
  {
    id: 'pending-approval',
    label: '승인 대기',
    value: APPROVAL_QUEUE.totalCount,
    iconSrc: metricApprovalIcon,
    tone: 'warning',
  },
  {
    id: 'due-today',
    label: '오늘 마감',
    value: 6,
    iconSrc: metricDueIcon,
    tone: 'info',
  },
  {
    id: 'needs-info',
    label: '정보 보완',
    value: 1,
    iconSrc: metricInfoIcon,
    tone: 'critical',
  },
  {
    id: 'worker-response',
    label: '근로자 응답',
    value: 8,
    iconSrc: metricResponseIcon,
    tone: 'success',
  },
]

export interface AgentPreparedItem {
  id: string
  label: string
  description?: string
}

export const AGENT_PREPARED = {
  prepared: [
    { id: 'documents', label: '필요 문서 5개 확인' },
    { id: 'draft', label: '체류연장 요청문 초안' },
    { id: 'connected', label: '기존 계약·체류 정보 연결' },
    { id: 'duplicate', label: '유사 업무 중복 여부 확인' },
  ] satisfies AgentPreparedItem[],
  review: [
    {
      id: 'passport',
      label: '여권 만료일 확인',
      description: '여권 원본과 만료일을 확인한 뒤 승인합니다.',
    },
    {
      id: 'deadline',
      label: '추천 마감일·담당자 확인',
      description: '업무량과 제출 기한을 확인한 뒤 확정합니다.',
    },
  ] satisfies AgentPreparedItem[],
  afterApproval: [
    {
      id: 'worker-request',
      label: '근로자 요청문 확인',
      description: '승인되면 근로자 요청 확인 단계가 열립니다.',
    },
    {
      id: 'secure-link',
      label: '보안 링크 발급 준비',
      description: '승인 후 담당자가 발급하고 근로자에게 전달합니다.',
    },
  ] satisfies AgentPreparedItem[],
}
