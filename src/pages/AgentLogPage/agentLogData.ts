import type { AgentSource } from '../../components/ui/AgentSourceLabel/AgentSourceLabel'

// TODO(backend): GET /api/agent-logs?period=&source=&q= -> AGENT_LOGS 대체

export interface AgentLogItem {
  id: string
  time: string
  description: string
  source: AgentSource
  relatedWorkId: string
}

export const AGENT_LOGS: AgentLogItem[] = [
  {
    id: 'LOG-1',
    time: '오늘 09:12',
    description: '응웬반A 체류연장 요청문 초안을 작성했습니다.',
    source: 'draft',
    relatedWorkId: 'WI-1',
  },
  {
    id: 'LOG-2',
    time: '오늘 08:47',
    description: '외국인등록증 사본 제출 요청 알림을 근로자에게 발송했습니다.',
    source: 'rule',
    relatedWorkId: 'WI-2',
  },
  {
    id: 'LOG-3',
    time: '어제 17:30',
    description: '박서준 근로자의 계약 정보를 조회해 취합 자료에 반영했습니다.',
    source: 'data',
    relatedWorkId: 'WI-3',
  },
  {
    id: 'LOG-4',
    time: '어제 14:05',
    description: 'HR이 신규 입사자 교육 일정 담당자 지정을 확인했습니다.',
    source: 'review',
    relatedWorkId: 'WI-4',
  },
  {
    id: 'LOG-5',
    time: '2026-07-18 11:20',
    description: '기숙사 점검 체크리스트를 등록된 규칙에 따라 생성했습니다.',
    source: 'rule',
    relatedWorkId: 'WI-5',
  },
]

export const PERIOD_OPTIONS = [
  { value: 'today', label: '기간 · 오늘' },
  { value: '7', label: '기간 · 7일' },
  { value: '30', label: '기간 · 30일' },
  { value: 'all', label: '기간 · 전체' },
]

export const SOURCE_OPTIONS = [
  { value: 'all', label: '근거 · 전체' },
  { value: 'rule', label: '근거 · 등록된 규칙' },
  { value: 'data', label: '근거 · 보유 데이터' },
  { value: 'draft', label: '근거 · Agent 초안' },
  { value: 'review', label: '근거 · HR 확인' },
]

export const TOTAL_AGENT_LOG_COUNT = 5
