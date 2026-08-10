import type { CasePriority, CaseSummaryResponse } from '../../api/cases'
import type { WorkerResponse } from '../../api/workers'

/**
 * 낮은 숫자가 먼저 처리할 우선순위다. 우선순위가 같으면 마감일, case_id 순으로 정렬해
 * API 응답 순서와 무관하게 항상 같은 결과를 만든다.
 */
export const WORK_INBOX_CASE_PRIORITY_ORDER = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
} satisfies Record<CasePriority, number>

export interface WorkInboxWorkerGroup {
  workerId: string
  workerDisplayName: string
  /** /workers 응답에서 찾은 근로자 상세 — 조회 범위 밖이면 null이다. */
  worker: WorkerResponse | null
  cases: CaseSummaryResponse[]
  /** 진행 중인 Case를 우선하고, 없으면 우선순위가 가장 높은 이력 Case를 사용한다. */
  primaryCase: CaseSummaryResponse | null
  activeCaseCount: number
  historyCaseCount: number
}

export type WorkInboxSort = 'priority' | 'due-date' | 'worker-name'
export type WorkInboxFilter = 'all' | 'active' | 'no-work'
export type WorkInboxFocus =
  | 'pending-approval'
  | 'due-today'
  | 'needs-info'
  | 'worker-response'

const WORK_INBOX_FOCUS_VALUES: readonly WorkInboxFocus[] = [
  'pending-approval',
  'due-today',
  'needs-info',
  'worker-response',
]

export interface BuildWorkInboxModelInput {
  cases: readonly CaseSummaryResponse[]
  workers: readonly WorkerResponse[]
  query?: string
  selectedWorkerId?: string | null
  sort?: WorkInboxSort
  filter?: WorkInboxFilter
  focus?: WorkInboxFocus | null
}

export interface WorkInboxModel {
  /** 검색 전 전체 그룹. */
  allGroups: WorkInboxWorkerGroup[]
  /** 정규화된 검색이 적용된 그룹. */
  groups: WorkInboxWorkerGroup[]
  selectedGroup: WorkInboxWorkerGroup | null
}

function compareStableText(left: string, right: string): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function dueDateSortValue(dueDate: string | null): number {
  if (!dueDate) return Number.POSITIVE_INFINITY
  const timestamp = Date.parse(dueDate)
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp
}

export function isActiveWorkInboxCase(item: CaseSummaryResponse): boolean {
  return item.display_status !== 'COMPLETED' && item.display_status !== 'CANCELLED'
}

export function compareWorkInboxCases(left: CaseSummaryResponse, right: CaseSummaryResponse): number {
  const priorityDifference =
    WORK_INBOX_CASE_PRIORITY_ORDER[left.priority] - WORK_INBOX_CASE_PRIORITY_ORDER[right.priority]
  if (priorityDifference !== 0) return priorityDifference

  const leftDueDate = dueDateSortValue(left.due_date)
  const rightDueDate = dueDateSortValue(right.due_date)
  if (leftDueDate < rightDueDate) return -1
  if (leftDueDate > rightDueDate) return 1

  return compareStableText(left.case_id, right.case_id)
}

export function normalizeWorkInboxSearch(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/gu, ' ').trim()
}

function compareWorkerGroups(left: WorkInboxWorkerGroup, right: WorkInboxWorkerGroup): number {
  const activityDifference = Number(right.activeCaseCount > 0) - Number(left.activeCaseCount > 0)
  if (activityDifference !== 0) return activityDifference

  if (left.primaryCase && right.primaryCase) {
    const primaryDifference = compareWorkInboxCases(left.primaryCase, right.primaryCase)
    if (primaryDifference !== 0) return primaryDifference
  } else if (left.primaryCase) {
    return -1
  } else if (right.primaryCase) {
    return 1
  }

  return compareStableText(left.workerId, right.workerId)
}

function compareWorkerGroupsByDueDate(
  left: WorkInboxWorkerGroup,
  right: WorkInboxWorkerGroup,
): number {
  const activityDifference = Number(right.activeCaseCount > 0) - Number(left.activeCaseCount > 0)
  if (activityDifference !== 0) return activityDifference

  const leftDueDate = dueDateSortValue(left.primaryCase?.due_date ?? null)
  const rightDueDate = dueDateSortValue(right.primaryCase?.due_date ?? null)
  if (leftDueDate < rightDueDate) return -1
  if (leftDueDate > rightDueDate) return 1
  return compareWorkerGroups(left, right)
}

export function sortWorkInboxGroups(
  groups: readonly WorkInboxWorkerGroup[],
  sort: WorkInboxSort,
): WorkInboxWorkerGroup[] {
  return [...groups].sort((left, right) => {
    if (sort === 'due-date') return compareWorkerGroupsByDueDate(left, right)
    if (sort === 'worker-name') {
      const nameDifference = left.workerDisplayName.localeCompare(right.workerDisplayName, 'ko-KR')
      return nameDifference || compareStableText(left.workerId, right.workerId)
    }
    return compareWorkerGroups(left, right)
  })
}

function matchesQuery(group: WorkInboxWorkerGroup, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true

  const queryTokens = normalizedQuery.split(' ')
  const searchableText = normalizeWorkInboxSearch(
    [
      group.workerDisplayName,
      group.worker?.nationality_code ?? '',
      group.worker?.visa_type ?? '',
      ...group.cases.flatMap((item) => [item.title, item.current_task?.title ?? '']),
    ].join(' '),
  )

  return queryTokens.every((token) => searchableText.includes(token))
}

function matchesFilter(group: WorkInboxWorkerGroup, filter: WorkInboxFilter): boolean {
  if (filter === 'active') return group.activeCaseCount > 0
  if (filter === 'no-work') return group.activeCaseCount === 0
  return true
}

export function parseWorkInboxFocus(value: string | null): WorkInboxFocus | null {
  return WORK_INBOX_FOCUS_VALUES.includes(value as WorkInboxFocus)
    ? (value as WorkInboxFocus)
    : null
}

function todayInSeoul(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const byType = new Map(parts.map((part) => [part.type, part.value]))
  return `${byType.get('year')}-${byType.get('month')}-${byType.get('day')}`
}

function matchesFocus(group: WorkInboxWorkerGroup, focus: WorkInboxFocus | null): boolean {
  if (!focus) return true

  return group.cases.some((item) => {
    if (focus === 'pending-approval') return item.current_task?.status === 'READY_FOR_REVIEW'
    if (focus === 'needs-info') return item.current_task?.status === 'NEEDS_INFO'
    if (focus === 'worker-response') return item.current_task?.status === 'WAITING_WORKER'

    const dueDate = item.current_task?.due_date ?? item.due_date
    return dueDate?.slice(0, 10) === todayInSeoul()
  })
}

export function buildWorkInboxModel({
  cases,
  workers,
  query = '',
  selectedWorkerId,
  sort = 'priority',
  filter = 'all',
  focus = null,
}: BuildWorkInboxModelInput): WorkInboxModel {
  const workerById = new Map(workers.map((worker) => [worker.worker_id, worker]))
  const casesByWorkerId = new Map<string, CaseSummaryResponse[]>()

  for (const item of cases) {
    const workerCases = casesByWorkerId.get(item.worker_id) ?? []
    workerCases.push(item)
    casesByWorkerId.set(item.worker_id, workerCases)
  }

  const workerIds = new Set([
    ...workers.map((worker) => worker.worker_id),
    ...cases.map((item) => item.worker_id),
  ])

  const allGroups = sortWorkInboxGroups(
    [...workerIds].map((workerId) => {
      const worker = workerById.get(workerId) ?? null
      const workerCases = casesByWorkerId.get(workerId) ?? []
      const sortedCases = [...workerCases].sort((left, right) => {
        const activityDifference =
          Number(isActiveWorkInboxCase(right)) - Number(isActiveWorkInboxCase(left))
        return activityDifference || compareWorkInboxCases(left, right)
      })
      const activeCaseCount = sortedCases.filter(isActiveWorkInboxCase).length
      return {
        workerId,
        workerDisplayName:
          worker?.display_name ?? sortedCases[0]?.worker_display_name ?? `근로자 ${workerId}`,
        worker,
        cases: sortedCases,
        primaryCase: sortedCases[0] ?? null,
        activeCaseCount,
        historyCaseCount: sortedCases.length - activeCaseCount,
      }
    }),
    sort,
  )

  const normalizedQuery = normalizeWorkInboxSearch(query)
  const groups = allGroups.filter(
    (group) =>
      matchesQuery(group, normalizedQuery) &&
      matchesFilter(group, filter) &&
      matchesFocus(group, focus),
  )
  const requestedSelection = selectedWorkerId?.trim()
  const selectedGroup =
    groups.find((group) => group.workerId === requestedSelection) ?? groups[0] ?? null

  return { allGroups, groups, selectedGroup }
}
