import type { WorkItemUrgency } from '../../components/ui/WorkItemRow/WorkItemRow'

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
    meta: 'D-12 · 승인 대기 · 담당 김민지',
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
