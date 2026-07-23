import type { StatusTone } from '../../components/ui/StatusLabel/StatusLabel'

// TODO(backend): GET /api/tickets?tab= -> TICKET_TABS, TICKETS 대체
// LINK-001/002의 "질문이 있습니다" 버튼(TODO(backend))이 실제로 생성할 데이터가 여기서 소비된다.

export interface TicketTab {
  id: string
  label: string
  count: number
}

export const TICKET_TABS: TicketTab[] = [
  { id: 'new', label: '신규', count: 2 },
  { id: 'waiting', label: '응답 대기', count: 3 },
  { id: 'done', label: '완료', count: 6 },
]

export type TicketStatus = 'new' | 'waiting' | 'done'

export const TICKET_STATUS_TONE: Record<TicketStatus, StatusTone> = {
  new: 'critical',
  waiting: 'warning',
  done: 'success',
}

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  new: '신규',
  waiting: '응답 대기',
  done: '완료',
}

export interface TicketItem {
  id: string
  workerName: string
  summary: string
  status: TicketStatus
  receivedAt: string
  /** 근로자 질문 원문 (목록에는 summary로 축약해 보여준다) */
  question: string
  /** 이 티켓과 관련된 업무. 없으면 null. */
  relatedCaseId: string | null
}

export const TICKETS: TicketItem[] = [
  {
    id: 'TICKET-1',
    workerName: '수라즈C',
    summary: '기숙사 인터넷이 이틀째 연결되지 않습니다.',
    status: 'new',
    receivedAt: '오늘 08:20',
    question: '기숙사 인터넷이 이틀째 연결되지 않습니다. 담당자님 확인 부탁드립니다.',
    relatedCaseId: 'WI-032',
  },
  {
    id: 'TICKET-2',
    workerName: '쩐티B',
    summary: '체류연장 서류 제출 방법을 다시 안내받고 싶습니다.',
    status: 'new',
    receivedAt: '오늘 07:55',
    question: '체류연장 서류를 어디에 어떻게 제출해야 하는지 다시 한번 안내받고 싶습니다.',
    relatedCaseId: 'WI-018',
  },
  {
    id: 'TICKET-3',
    workerName: '아흐메드D',
    summary: '급여명세서에서 공제 항목 문의드립니다.',
    status: 'waiting',
    receivedAt: '어제 18:40',
    question: '이번 달 급여명세서에서 공제된 항목이 지난달과 달라서 문의드립니다.',
    relatedCaseId: null,
  },
  {
    id: 'TICKET-4',
    workerName: '응웬반A',
    summary: '건강검진 예약 일정을 변경할 수 있는지 문의합니다.',
    status: 'waiting',
    receivedAt: '어제 15:10',
    question: '건강검진 예약 일정을 다음 주로 변경할 수 있을까요?',
    relatedCaseId: 'WI-021',
  },
  {
    id: 'TICKET-5',
    workerName: '박서준',
    summary: '외국인등록증 재발급 절차를 안내받았습니다.',
    status: 'done',
    receivedAt: '2026-07-17',
    question: '외국인등록증을 분실해서 재발급 절차가 궁금합니다.',
    relatedCaseId: null,
  },
]

export const TOTAL_TICKET_COUNT = 11
