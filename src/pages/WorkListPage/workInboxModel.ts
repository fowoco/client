import type { TaskStatus, TaskSummaryResponse } from '../../api/tasks'
import type { WorkerResponse } from '../../api/workers'

/**
 * 현재 목록 API만으로 업무함에서 표현할 수 없는 값이다.
 *
 * 이 모델은 누락된 값을 추측하거나 화면 샘플로 채우지 않는다. 백엔드 projection API가
 * 추가되면 이 목록과 아래 파생 모델을 함께 갱신해야 한다.
 */
export const WORK_INBOX_API_GAPS = {
  casePresentation:
    'TaskSummaryResponse에는 case_id만 있으며 Case 제목, 전체 단계 수, 체크리스트 진행률은 없다.',
  recommendedAction: 'TaskSummaryResponse에는 추천 CTA, 판단 근거, 담당자 또는 승인자 정보가 없다.',
  workerPresentation: 'WorkerResponse에는 비자 유형과 근무 라인 또는 부서 정보가 없다.',
  unassignedTask:
    'TaskSummaryResponse.worker_id는 필수다. Worker 목록에 없는 참조는 대상 미지정이 아니라 조회 범위 밖 또는 무결성 문제다.',
} as const

/**
 * 낮은 숫자가 먼저 처리할 상태다. 상태 우선순위가 같을 때 마감일, task_id 순으로
 * 정렬해 API 응답 순서와 무관하게 항상 같은 결과를 만든다.
 */
export const WORK_INBOX_TASK_STATUS_PRIORITY = {
  READY_FOR_REVIEW: 0,
  NEEDS_INFO: 1,
  APPROVED: 2,
  DRAFT: 3,
  WAITING_WORKER: 4,
  WAITING_EXTERNAL: 5,
  COMPLETED: 6,
  CANCELLED: 7,
} satisfies Record<TaskStatus, number>

export interface WorkInboxTask {
  task: TaskSummaryResponse
  /**
   * Workflow catalog 조회가 실패했거나 정의가 누락되면 null이다. workflow_id를 이름처럼
   * 표시하지 않도록 호출자가 null 상태를 명시적으로 처리한다.
   */
  workflowName: string | null
}

export interface WorkInboxCaseGroup {
  /**
   * 실제 Case는 `case:<case_id>`, case_id가 없는 Task fallback은 `task:<task_id>`다.
   */
  key: string
  caseId: string | null
  source: 'case' | 'task-fallback'
  tasks: WorkInboxTask[]
  primaryTask: WorkInboxTask
}

export interface WorkInboxCaseProgress {
  completed: number
  total: number
}

export interface WorkInboxWorkerGroup {
  worker: WorkerResponse
  tasks: WorkInboxTask[]
  cases: WorkInboxCaseGroup[]
  primaryTask: WorkInboxTask
  primaryCase: WorkInboxCaseGroup
}

export interface WorkInboxDiagnostics {
  /**
   * Task에는 worker_id가 있지만 현재 Worker 응답에는 없는 참조다. 의도적으로 대상이 없는
   * 업무라고 해석하면 안 된다.
   */
  missingWorkerIds: string[]
  missingWorkflowIds: string[]
}

export interface BuildWorkInboxModelInput {
  workers: readonly WorkerResponse[]
  tasks: readonly TaskSummaryResponse[]
  workflowNameById?: ReadonlyMap<string, string>
  query?: string
  selectedWorkerId?: string | null
  sort?: WorkInboxSort
}

export type WorkInboxSort = 'priority' | 'due-date' | 'worker-name'

export interface WorkInboxModel {
  /** 검색 전 전체 그룹. Task가 하나 이상 연결된 실제 근로자만 포함한다. */
  allGroups: WorkInboxWorkerGroup[]
  /** 정규화된 검색이 적용된 그룹. */
  groups: WorkInboxWorkerGroup[]
  selectedGroup: WorkInboxWorkerGroup | null
  selectedWorker: WorkerResponse | null
  /**
   * Worker 목록에서 참조를 해결하지 못한 Task다. 실제 근로자 그룹이나
   * '대상 미지정 업무' 그룹으로 변환하지 않는다.
   */
  orphanTasks: WorkInboxTask[]
  diagnostics: WorkInboxDiagnostics
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

export function compareWorkInboxTasks(left: WorkInboxTask, right: WorkInboxTask): number {
  const statusDifference =
    WORK_INBOX_TASK_STATUS_PRIORITY[left.task.status] -
    WORK_INBOX_TASK_STATUS_PRIORITY[right.task.status]
  if (statusDifference !== 0) return statusDifference

  const leftDueDate = dueDateSortValue(left.task.due_date)
  const rightDueDate = dueDateSortValue(right.task.due_date)
  if (leftDueDate < rightDueDate) return -1
  if (leftDueDate > rightDueDate) return 1

  return compareStableText(left.task.task_id, right.task.task_id)
}

export function normalizeWorkInboxSearch(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/gu, ' ').trim()
}

function toWorkInboxTask(
  task: TaskSummaryResponse,
  workflowNameById: ReadonlyMap<string, string> | undefined,
): WorkInboxTask {
  const workflowName = workflowNameById?.get(task.workflow_id)?.trim()
  return {
    task,
    workflowName: workflowName || null,
  }
}

function buildCaseGroups(tasks: WorkInboxTask[]): WorkInboxCaseGroup[] {
  const tasksByCaseKey = new Map<string, WorkInboxTask[]>()

  for (const task of tasks) {
    const key = task.task.case_id ? `case:${task.task.case_id}` : `task:${task.task.task_id}`
    const caseTasks = tasksByCaseKey.get(key) ?? []
    caseTasks.push(task)
    tasksByCaseKey.set(key, caseTasks)
  }

  return [...tasksByCaseKey.entries()]
    .map(([key, caseTasks]) => {
      const sortedTasks = [...caseTasks].sort(compareWorkInboxTasks)
      const caseId = sortedTasks[0].task.case_id
      return {
        key,
        caseId,
        source: caseId ? ('case' as const) : ('task-fallback' as const),
        tasks: sortedTasks,
        primaryTask: sortedTasks[0],
      }
    })
    .sort((left, right) => {
      const primaryDifference = compareWorkInboxTasks(left.primaryTask, right.primaryTask)
      return primaryDifference || compareStableText(left.key, right.key)
    })
}

function compareWorkerGroups(left: WorkInboxWorkerGroup, right: WorkInboxWorkerGroup): number {
  const primaryDifference = compareWorkInboxTasks(left.primaryTask, right.primaryTask)
  return primaryDifference || compareStableText(left.worker.worker_id, right.worker.worker_id)
}

function compareWorkerGroupsByDueDate(
  left: WorkInboxWorkerGroup,
  right: WorkInboxWorkerGroup,
): number {
  const leftDueDate = dueDateSortValue(left.primaryTask.task.due_date)
  const rightDueDate = dueDateSortValue(right.primaryTask.task.due_date)
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
      const nameDifference = left.worker.display_name.localeCompare(
        right.worker.display_name,
        'ko-KR',
      )
      return nameDifference || compareStableText(left.worker.worker_id, right.worker.worker_id)
    }
    return compareWorkerGroups(left, right)
  })
}

export function getWorkInboxCaseProgress(caseGroup: WorkInboxCaseGroup): WorkInboxCaseProgress {
  return {
    completed: caseGroup.tasks.filter((item) => item.task.status === 'COMPLETED').length,
    total: caseGroup.tasks.length,
  }
}

function matchesQuery(group: WorkInboxWorkerGroup, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true

  const queryTokens = normalizedQuery.split(' ')
  const searchableText = normalizeWorkInboxSearch(
    [
      group.worker.display_name,
      ...group.tasks.flatMap((item) => [
        item.task.title,
        item.task.case_id ?? '',
        item.workflowName ?? '',
      ]),
    ].join(' '),
  )

  return queryTokens.every((token) => searchableText.includes(token))
}

export function buildWorkInboxModel({
  workers,
  tasks,
  workflowNameById,
  query = '',
  selectedWorkerId,
  sort = 'priority',
}: BuildWorkInboxModelInput): WorkInboxModel {
  const workerById = new Map(workers.map((worker) => [worker.worker_id, worker]))
  const tasksByWorkerId = new Map<string, WorkInboxTask[]>()
  const orphanTasks: WorkInboxTask[] = []
  const missingWorkerIds = new Set<string>()
  const missingWorkflowIds = new Set<string>()

  for (const task of tasks) {
    const item = toWorkInboxTask(task, workflowNameById)
    if (!item.workflowName) missingWorkflowIds.add(task.workflow_id)

    if (!workerById.has(task.worker_id)) {
      orphanTasks.push(item)
      missingWorkerIds.add(task.worker_id)
      continue
    }

    const workerTasks = tasksByWorkerId.get(task.worker_id) ?? []
    workerTasks.push(item)
    tasksByWorkerId.set(task.worker_id, workerTasks)
  }

  const allGroups = sortWorkInboxGroups(
    [...tasksByWorkerId.entries()].map(([workerId, workerTasks]) => {
      const sortedTasks = [...workerTasks].sort(compareWorkInboxTasks)
      const cases = buildCaseGroups(sortedTasks)
      return {
        worker: workerById.get(workerId) as WorkerResponse,
        tasks: sortedTasks,
        cases,
        primaryTask: sortedTasks[0],
        primaryCase: cases[0],
      }
    }),
    sort,
  )

  const normalizedQuery = normalizeWorkInboxSearch(query)
  const groups = allGroups.filter((group) => matchesQuery(group, normalizedQuery))
  const requestedSelection = selectedWorkerId?.trim()
  const selectedGroup =
    groups.find((group) => group.worker.worker_id === requestedSelection) ?? groups[0] ?? null

  return {
    allGroups,
    groups,
    selectedGroup,
    selectedWorker: selectedGroup?.worker ?? null,
    orphanTasks: orphanTasks.sort(compareWorkInboxTasks),
    diagnostics: {
      missingWorkerIds: [...missingWorkerIds].sort(compareStableText),
      missingWorkflowIds: [...missingWorkflowIds].sort(compareStableText),
    },
  }
}
