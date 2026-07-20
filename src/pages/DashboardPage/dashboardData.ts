export interface DashboardStat {
  label: string
  count: number
  unit: string
  color: string
}

export const DASHBOARD_STATS: DashboardStat[] = [
  { label: '체류 D-60', count: 3, unit: '명', color: '#008381' },
  { label: '서류 미제출', count: 5, unit: '건', color: '#b6a7e7' },
  { label: '교육 미확인', count: 2, unit: '건', color: '#6bb348' },
  { label: '급여 질문', count: 1, unit: '건', color: '#f6962b' },
  { label: '미확인 안내', count: 4, unit: '건', color: '#29aab2' },
]

export interface TaskCardSummary {
  title: string
}

export const TASK_BOARD_PREVIEW: TaskCardSummary[] = [
  { title: '체류연장 서류요청' },
  { title: '급여 변동 설명' },
  { title: '라인 이동 안내' },
]

export const AGENT_RECOMMENDATION = {
  badge: '오늘 가장 먼저 처리할 일',
  title: '응우옌 · 체류연장 서류',
  detail: 'D-60 / 여권 미제출',
  actionLabel: '안내문 생성하기',
}

export const TODAY_DETECTED_TASK_COUNT = 7

export const WORKER_CONFIRMATION_LOOP = '근로자 확인 루프: 링크 발송 → 응답분류 → 티켓 생성'
