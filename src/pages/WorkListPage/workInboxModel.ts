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
  primaryCase: CaseSummaryResponse
}

export type WorkInboxSort = 'priority' | 'due-date' | 'worker-name'

export interface BuildWorkInboxModelInput {
  cases: readonly CaseSummaryResponse[]
  workers: readonly WorkerResponse[]
  query?: string
  selectedWorkerId?: string | null
  sort?: WorkInboxSort
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
  const primaryDifference = compareWorkInboxCases(left.primaryCase, right.primaryCase)
  return primaryDifference || compareStableText(left.workerId, right.workerId)
}

function compareWorkerGroupsByDueDate(
  left: WorkInboxWorkerGroup,
  right: WorkInboxWorkerGroup,
): number {
  const leftDueDate = dueDateSortValue(left.primaryCase.due_date)
  const rightDueDate = dueDateSortValue(right.primaryCase.due_date)
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
      ...group.cases.flatMap((item) => [item.title, item.current_task?.title ?? '']),
    ].join(' '),
  )

  return queryTokens.every((token) => searchableText.includes(token))
}

export function buildWorkInboxModel({
  cases,
  workers,
  query = '',
  selectedWorkerId,
  sort = 'priority',
}: BuildWorkInboxModelInput): WorkInboxModel {
  const workerById = new Map(workers.map((worker) => [worker.worker_id, worker]))
  const casesByWorkerId = new Map<string, CaseSummaryResponse[]>()

  for (const item of cases) {
    const workerCases = casesByWorkerId.get(item.worker_id) ?? []
    workerCases.push(item)
    casesByWorkerId.set(item.worker_id, workerCases)
  }

  const allGroups = sortWorkInboxGroups(
    [...casesByWorkerId.entries()].map(([workerId, workerCases]) => {
      const sortedCases = [...workerCases].sort(compareWorkInboxCases)
      return {
        workerId,
        workerDisplayName: sortedCases[0].worker_display_name,
        worker: workerById.get(workerId) ?? null,
        cases: sortedCases,
        primaryCase: sortedCases[0],
      }
    }),
    sort,
  )

  const normalizedQuery = normalizeWorkInboxSearch(query)
  const groups = allGroups.filter((group) => matchesQuery(group, normalizedQuery))
  const requestedSelection = selectedWorkerId?.trim()
  const selectedGroup =
    groups.find((group) => group.workerId === requestedSelection) ?? groups[0] ?? null

  return { allGroups, groups, selectedGroup }
}
