import type { WorkItemUrgency } from '../../components/ui/WorkItemRow/WorkItemRow'
import { EXAMPLE_PROMPTS } from '../CreateWorkPage/createWorkData'

// TODO(backend): 이 파일의 상수는 데모용 목데이터. 실제 연동 시 아래 엔드포인트로 대체
// - GET /api/dashboard/work-items -> TODAY_WORK_ITEMS
// - GET /api/dashboard/upcoming-timeline -> UPCOMING_TIMELINE
// - GET /api/dashboard/approval-queue -> APPROVAL_QUEUE
// - GET /api/dashboard/agent-summary -> AGENT_SUMMARY

export interface WorkItem {
  id: string
  title: string
  meta: string
  nextAction: string
  urgency: WorkItemUrgency
}

export const TODAY_WORK_ITEMS: WorkItem[] = [
  {
    id: 'WI-1',
    title: '응웬반A 체류연장 준비',
    meta: 'D-12 · 승인 대기 · 담당 김경민',
    nextAction: '다음 · 요청문 승인',
    urgency: 'warning',
  },
  {
    id: 'WI-2',
    title: '외국인등록증 사본 제출 요청',
    meta: '오늘 · 근로자 응답 대기',
    nextAction: '다음 · 응답 확인',
    urgency: 'warning',
  },
  {
    id: 'WI-3',
    title: '7월 외부기관 제출자료 취합',
    meta: 'D-2 · 증빙 필요 · 담당 박서준',
    nextAction: '다음 · 자료 검토',
    urgency: 'warning',
  },
]

export const UPCOMING_TIMELINE = ['오늘 · 보험자료 확인', 'D-2 · 외부기관 제출', 'D-7 · 체류만료 사전점검']

export const APPROVAL_QUEUE = {
  count: 2,
  oldestLabel: '가장 오래된 요청',
  oldestValue: '3시간 전',
}

export const AGENT_SUMMARY = {
  headline: '체류연장 업무 1건에서 여권 사본이 부족합니다.',
  body: '근로자 요청문과 72시간 보안 링크를 준비했습니다. 승인 후 직접 전달할 수 있습니다.',
  actionLabel: '다음 행동 · 요청문 검토',
}

// Figma HOME-001(node 1291:209)의 자연어 입력 프롬프트 칩은 CreateWorkPage의 예시 칩과 동일 문구.
export const AI_REQUEST_PROMPT_CHIPS = EXAMPLE_PROMPTS

export interface DashboardMetric {
  id: string
  label: string
  value: number
}

// TODO(backend): GET /api/dashboard/metrics -> METRIC_STRIP 대체
export const METRIC_STRIP: DashboardMetric[] = [
  { id: 'pending-approval', label: '승인 대기', value: APPROVAL_QUEUE.count },
  { id: 'remaining-work', label: '남은 업무', value: 6 },
  { id: 'due-risk', label: '기한 위험', value: 1 },
  { id: 'done-today', label: '오늘 완료', value: 8 },
]

export interface AiPreparedItem {
  id: string
  label: string
  status: 'done' | 'next'
}

// TODO(backend): GET /api/dashboard/agent-progress -> AI_PREPARED_CHECKLIST 대체
export const AI_PREPARED_CHECKLIST: AiPreparedItem[] = [
  { id: 'docs-checked', label: '필요 서류 5개 확인 완료', status: 'done' },
  { id: 'draft-ready', label: '체류연장 요청문 초안 준비', status: 'done' },
  { id: 'next-step', label: '다음 단계 · 담당자 검토 및 승인', status: 'next' },
]
