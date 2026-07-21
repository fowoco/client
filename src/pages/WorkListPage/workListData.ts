// TODO(backend): GET /api/work-items?tab=&status=&due=&q= -> WORK_TABS, WORK_ITEMS 대체
// 백엔드 연동 전까지는 tabIds/status/dueDays 기준으로 클라이언트에서 직접 필터링한다.

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

export type WorkTabId = 'mine' | 'my-approval' | 'follow-up'
export type WorkItemStatus = 'pending' | 'waiting-response' | 'other'

export interface WorkListItem {
  id: string
  title: string
  meta: string
  nextAction: string
  tabIds: WorkTabId[]
  status: WorkItemStatus
  dueDays: number
}

export const WORK_ITEMS: WorkListItem[] = [
  {
    id: 'WI-1',
    title: '응웬반A 체류연장 준비',
    meta: 'D-12 · 승인 대기 · 체류 · 김경민',
    nextAction: '다음 · 요청문 승인',
    tabIds: ['mine', 'my-approval'],
    status: 'pending',
    dueDays: 12,
  },
  {
    id: 'WI-2',
    title: '외국인등록증 사본 제출 요청',
    meta: '오늘 · 근로자 응답 대기 · 서류',
    nextAction: '다음 · 응답 확인',
    tabIds: ['mine'],
    status: 'waiting-response',
    dueDays: 0,
  },
  {
    id: 'WI-3',
    title: '7월 외부기관 제출자료 취합',
    meta: 'D-2 · 증빙 필요 · 외부기관 · 박서준',
    nextAction: '다음 · 자료 검토',
    tabIds: ['follow-up'],
    status: 'other',
    dueDays: 2,
  },
  {
    id: 'WI-4',
    title: '신규 입사자 교육 일정 확정',
    meta: 'D-4 · 담당자 미배정 · 일반행정',
    nextAction: '다음 · 담당자 지정',
    tabIds: ['follow-up'],
    status: 'other',
    dueDays: 4,
  },
  {
    id: 'WI-5',
    title: '월간 기숙사 점검 결과 정리',
    meta: 'D-7 · 준비 중 · 연결 근로자 없음',
    nextAction: '다음 · 체크리스트',
    tabIds: ['follow-up'],
    status: 'other',
    dueDays: 7,
  },
  {
    id: 'WI-6',
    title: '쩐티B 표준근로계약서 갱신',
    meta: 'D-9 · 승인 대기 · 계약 · 김경민',
    nextAction: '다음 · 계약서 승인',
    tabIds: ['mine', 'my-approval'],
    status: 'pending',
    dueDays: 9,
  },
  {
    id: 'WI-7',
    title: '수라즈C 건강검진 예약 확인',
    meta: 'D-10 · 준비 중 · 건강검진 · 김경민',
    nextAction: '다음 · 예약 확인',
    tabIds: ['mine'],
    status: 'other',
    dueDays: 10,
  },
  {
    id: 'WI-8',
    title: '아흐메드D 급여명세서 공제 문의 회신',
    meta: 'D-1 · 근로자 응답 대기 · 급여 · 김경민',
    nextAction: '다음 · 답변 발송',
    tabIds: ['mine'],
    status: 'waiting-response',
    dueDays: 1,
  },
  {
    id: 'WI-9',
    title: '솜차이E 신규 교육 자료 배포',
    meta: 'D-14 · 준비 중 · 교육 · 김경민',
    nextAction: '다음 · 자료 확인',
    tabIds: ['mine'],
    status: 'other',
    dueDays: 14,
  },
  {
    id: 'WI-10',
    title: '박서준 담당 업무 인수인계',
    meta: 'D-6 · 진행 중 · 일반행정 · 김경민',
    nextAction: '다음 · 인수 확인',
    tabIds: ['mine'],
    status: 'other',
    dueDays: 6,
  },
  {
    id: 'WI-11',
    title: '8월 외국인등록증 유효기간 일괄 확인',
    meta: 'D-18 · 준비 중 · 체류',
    nextAction: '다음 · 대상자 목록 확인',
    tabIds: ['mine'],
    status: 'other',
    dueDays: 18,
  },
  {
    id: 'WI-12',
    title: '기숙사 소방점검 결과 보고',
    meta: 'D-11 · 준비 중 · 일반행정',
    nextAction: '다음 · 보고서 작성',
    tabIds: [],
    status: 'other',
    dueDays: 11,
  },
  {
    id: 'WI-13',
    title: '통근버스 노선 변경 안내',
    meta: 'D-16 · 준비 중 · 일반행정',
    nextAction: '다음 · 안내문 발송',
    tabIds: [],
    status: 'other',
    dueDays: 16,
  },
  {
    id: 'WI-14',
    title: '외부기관 정기 점검 자료 준비',
    meta: 'D-20 · 증빙 필요 · 외부기관',
    nextAction: '다음 · 자료 취합',
    tabIds: [],
    status: 'other',
    dueDays: 20,
  },
  {
    id: 'WI-15',
    title: '9월 급여 지급일 사전 공지',
    meta: 'D-25 · 준비 중 · 급여',
    nextAction: '다음 · 공지 초안',
    tabIds: [],
    status: 'other',
    dueDays: 25,
  },
  {
    id: 'WI-16',
    title: '신규 입사자 기숙사 배정',
    meta: 'D-5 · 담당자 미배정 · 일반행정',
    nextAction: '다음 · 배정표 작성',
    tabIds: [],
    status: 'other',
    dueDays: 5,
  },
  {
    id: 'WI-17',
    title: '외국인 고용허가 연장 서류 준비',
    meta: 'D-28 · 증빙 필요 · 체류',
    nextAction: '다음 · 서류 목록 확인',
    tabIds: [],
    status: 'other',
    dueDays: 28,
  },
  {
    id: 'WI-18',
    title: '근로계약서 전자서명 전환 검토',
    meta: 'D-26 · 준비 중 · 계약',
    nextAction: '다음 · 검토 의견 정리',
    tabIds: [],
    status: 'other',
    dueDays: 26,
  },
  {
    id: 'WI-19',
    title: '기숙사 비품 정기 점검',
    meta: 'D-15 · 준비 중 · 일반행정',
    nextAction: '다음 · 점검표 작성',
    tabIds: [],
    status: 'other',
    dueDays: 15,
  },
  {
    id: 'WI-20',
    title: '연차 사용 현황 정리',
    meta: 'D-13 · 준비 중 · 일반행정',
    nextAction: '다음 · 현황표 정리',
    tabIds: [],
    status: 'other',
    dueDays: 13,
  },
  {
    id: 'WI-21',
    title: '외국인등록증 재발급 안내',
    meta: '오늘 · 근로자 응답 대기 · 서류',
    nextAction: '다음 · 응답 확인',
    tabIds: [],
    status: 'waiting-response',
    dueDays: 0,
  },
  {
    id: 'WI-22',
    title: '분기별 안전교육 일정 확정',
    meta: 'D-22 · 담당자 미배정 · 교육',
    nextAction: '다음 · 담당자 지정',
    tabIds: [],
    status: 'other',
    dueDays: 22,
  },
  {
    id: 'WI-23',
    title: '근로자 통역 지원 요청 접수',
    meta: 'D-3 · 준비 중 · 일반행정',
    nextAction: '다음 · 지원 배정',
    tabIds: [],
    status: 'other',
    dueDays: 3,
  },
  {
    id: 'WI-24',
    title: '10월 외부기관 제출자료 사전 취합',
    meta: 'D-29 · 준비 중 · 외부기관',
    nextAction: '다음 · 자료 취합',
    tabIds: [],
    status: 'other',
    dueDays: 29,
  },
]

export const TOTAL_WORK_COUNT = 24
