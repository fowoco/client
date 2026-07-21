// TODO(backend): GET /api/workers?deadline=90d&q= -> WORKERS 대체
// 백엔드 연동 전까지는 deadlineDays 기준으로 클라이언트에서 직접 필터링한다.
// TODO(backend): GET /api/workers/:id -> 선택된 근로자의 currentTasks/timeline 대체

export interface WorkerTask {
  title: string
  detail: string
  linkTone: 'warning' | 'primary'
}

export interface WorkerTimelineEntry {
  date: string
  label: string
  highlighted: boolean
}

export interface Worker {
  id: string
  name: string
  nationality: string
  visaType: string
  employeeId: string
  phone: string
  deadlineLabel: string
  deadlineHighlighted: boolean
  /** null이면 임박한 기한이 없어 기한 필터 값과 무관하게 항상 표시한다. */
  deadlineDays: number | null
  note: string
  currentTasks: WorkerTask[]
  timeline: WorkerTimelineEntry[]
}

export const WORKERS: Worker[] = [
  {
    id: 'W-021',
    name: '응웬반A',
    nationality: '베트남',
    visaType: 'E-9',
    employeeId: 'F-021',
    phone: '010-****-3182',
    deadlineLabel: 'D-12 체류',
    deadlineHighlighted: true,
    deadlineDays: 12,
    note: '진행 업무 2건',
    currentTasks: [
      { title: '체류연장 준비', detail: '승인 대기 · D-12', linkTone: 'warning' },
      { title: '여권 사본 요청', detail: '근로자 응답 대기 · 오늘', linkTone: 'primary' },
    ],
    timeline: [
      { date: '07.20', label: 'Agent가 체류연장 업무 초안 준비', highlighted: true },
      { date: '07.18', label: '외국인등록증 유효기간 확인', highlighted: false },
      { date: '07.02', label: '7월 급여명세 안내 확인', highlighted: false },
      { date: '06.14', label: '기숙사 교육 완료', highlighted: false },
    ],
  },
  {
    id: 'W-018',
    name: '쩐티B',
    nationality: '베트남',
    visaType: 'E-9',
    employeeId: 'F-018',
    phone: '010-****-2091',
    deadlineLabel: 'D-21 서류',
    deadlineHighlighted: true,
    deadlineDays: 21,
    note: '서류 누락 1건',
    currentTasks: [{ title: '외국인등록증 사본 제출 요청', detail: '오늘 · 근로자 응답 대기', linkTone: 'warning' }],
    timeline: [{ date: '07.19', label: '서류 미제출 안내 발송', highlighted: true }],
  },
  {
    id: 'W-032',
    name: '수라즈C',
    nationality: '네팔',
    visaType: 'E-9',
    employeeId: 'F-032',
    phone: '010-****-7745',
    deadlineLabel: 'D-35 체류',
    deadlineHighlighted: true,
    deadlineDays: 35,
    note: '응답 대기 1건',
    currentTasks: [{ title: '체류연장 안내 응답 대기', detail: '오늘 · 근로자 응답 대기', linkTone: 'warning' }],
    timeline: [{ date: '07.15', label: '체류연장 안내 발송', highlighted: true }],
  },
  {
    id: 'W-014',
    name: '아흐메드D',
    nationality: '방글라데시',
    visaType: 'E-9',
    employeeId: 'F-014',
    phone: '010-****-5510',
    deadlineLabel: 'D-62 체류',
    deadlineHighlighted: true,
    deadlineDays: 62,
    note: '진행 업무 없음',
    currentTasks: [],
    timeline: [{ date: '06.28', label: '입사 서류 확인 완료', highlighted: false }],
  },
  {
    id: 'W-027',
    name: '솜차이E',
    nationality: '태국',
    visaType: 'E-9',
    employeeId: 'F-027',
    phone: '010-****-6623',
    deadlineLabel: '정상',
    deadlineHighlighted: false,
    deadlineDays: null,
    note: '교육 일정 1건',
    currentTasks: [{ title: '신규 교육 일정 확정', detail: 'D-4 · 담당자 미배정', linkTone: 'warning' }],
    timeline: [{ date: '07.10', label: '교육 일정 등록', highlighted: false }],
  },
]

export const TOTAL_WORKER_COUNT = 28
