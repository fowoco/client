import type { WorkItemUrgency } from '../../components/ui/WorkItemRow/WorkItemRow'

// TODO(backend): GET /api/work-items?tab=&status=&due=&q= -> WORK_TABS, WORK_ITEMS 대체

export interface WorkTab {
  id: string
  label: string
  count: number
}

export const WORK_TABS: WorkTab[] = [
  { id: 'all', label: '전체', count: 24 },
  { id: 'mine', label: '내 업무', count: 8 },
  { id: 'my-approval', label: '내가 승인할 업무', count: 2 },
  { id: 'follow-up', label: '후속조치', count: 3 },
]

export interface WorkListItem {
  id: string
  title: string
  meta: string
  nextAction: string
  urgency: WorkItemUrgency
}

export const WORK_ITEMS: WorkListItem[] = [
  {
    id: 'WI-1',
    title: '응웬반A 체류연장 준비',
    meta: 'D-12 · 승인 대기 · 체류 · 김경민',
    nextAction: '다음 · 요청문 승인',
    urgency: 'warning',
  },
  {
    id: 'WI-2',
    title: '외국인등록증 사본 제출 요청',
    meta: '오늘 · 근로자 응답 대기 · 서류',
    nextAction: '다음 · 응답 확인',
    urgency: 'warning',
  },
  {
    id: 'WI-3',
    title: '7월 외부기관 제출자료 취합',
    meta: 'D-2 · 증빙 필요 · 외부기관 · 박서준',
    nextAction: '다음 · 자료 검토',
    urgency: 'warning',
  },
  {
    id: 'WI-4',
    title: '신규 입사자 교육 일정 확정',
    meta: 'D-4 · 담당자 미배정 · 일반행정',
    nextAction: '다음 · 담당자 지정',
    urgency: 'warning',
  },
  {
    id: 'WI-5',
    title: '월간 기숙사 점검 결과 정리',
    meta: 'D-7 · 준비 중 · 연결 근로자 없음',
    nextAction: '다음 · 체크리스트',
    urgency: 'warning',
  },
]

export const TOTAL_WORK_COUNT = 24
