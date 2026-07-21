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
}

export const TICKETS: TicketItem[] = [
  {
    id: 'TICKET-1',
    workerName: '수라즈C',
    summary: '기숙사 인터넷이 이틀째 연결되지 않습니다.',
    status: 'new',
    receivedAt: '오늘 08:20',
  },
  {
    id: 'TICKET-2',
    workerName: '쩐티B',
    summary: '체류연장 서류 제출 방법을 다시 안내받고 싶습니다.',
    status: 'new',
    receivedAt: '오늘 07:55',
  },
  {
    id: 'TICKET-3',
    workerName: '아흐메드D',
    summary: '급여명세서에서 공제 항목 문의드립니다.',
    status: 'waiting',
    receivedAt: '어제 18:40',
  },
  {
    id: 'TICKET-4',
    workerName: '응웬반A',
    summary: '건강검진 예약 일정을 변경할 수 있는지 문의합니다.',
    status: 'waiting',
    receivedAt: '어제 15:10',
  },
  {
    id: 'TICKET-5',
    workerName: '박서준',
    summary: '외국인등록증 재발급 절차를 안내받았습니다.',
    status: 'done',
    receivedAt: '2026-07-17',
  },
]

export const TOTAL_TICKET_COUNT = 11
