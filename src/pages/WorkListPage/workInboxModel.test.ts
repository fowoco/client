import { describe, expect, it } from 'vitest'
import type { TaskSummaryResponse } from '../../api/tasks'
import type { WorkerResponse } from '../../api/workers'
import {
  buildWorkInboxModel,
  compareWorkInboxTasks,
  getWorkInboxCaseProgress,
  normalizeWorkInboxSearch,
  type WorkInboxTask,
} from './workInboxModel'

function worker(workerId: string, displayName = `근로자 ${workerId}`): WorkerResponse {
  return {
    worker_id: workerId,
    company_id: 'C-1',
    display_name: displayName,
    nationality_code: 'VN',
    preferred_language: 'vi',
    work_status: 'ACTIVE',
    stay_expiry_date: null,
    contract_start_date: null,
    contract_end_date: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    version: 1,
  }
}

function task(
  taskId: string,
  workerId: string,
  overrides: Partial<TaskSummaryResponse> = {},
): TaskSummaryResponse {
  return {
    task_id: taskId,
    worker_id: workerId,
    case_id: null,
    task_type: 'STAY_PERIOD_EXTENSION',
    workflow_id: 'wf-stay-extension',
    workflow_catalog_version: '1',
    title: `업무 ${taskId}`,
    source: 'MANUAL',
    status: 'DRAFT',
    due_date: null,
    content_revision: 1,
    version: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function inboxTask(value: TaskSummaryResponse): WorkInboxTask {
  return { task: value, workflowName: null }
}

describe('workInboxModel', () => {
  it('creates groups only for workers that have tasks and keeps unresolved references separate', () => {
    const model = buildWorkInboxModel({
      workers: [worker('W-1'), worker('W-2')],
      tasks: [task('T-1', 'W-1'), task('T-orphan', 'W-missing', { workflow_id: 'wf-missing' })],
      workflowNameById: new Map([['wf-stay-extension', '체류기간 연장']]),
    })

    expect(model.groups.map((group) => group.worker.worker_id)).toEqual(['W-1'])
    expect(model.groups.some((group) => group.worker.worker_id === 'W-2')).toBe(false)
    expect(model.orphanTasks.map((item) => item.task.task_id)).toEqual(['T-orphan'])
    expect(model.diagnostics.missingWorkerIds).toEqual(['W-missing'])
    expect(model.diagnostics.missingWorkflowIds).toEqual(['wf-missing'])
  })

  it('returns no worker groups when there are no tasks', () => {
    const model = buildWorkInboxModel({
      workers: [worker('W-1')],
      tasks: [],
    })

    expect(model.allGroups).toEqual([])
    expect(model.groups).toEqual([])
    expect(model.selectedGroup).toBeNull()
    expect(model.selectedWorker).toBeNull()
  })

  it('groups shared case ids and gives every task without a case its own fallback case', () => {
    const model = buildWorkInboxModel({
      workers: [worker('W-1')],
      tasks: [
        task('T-1', 'W-1', { case_id: 'CASE-1' }),
        task('T-2', 'W-1', { case_id: 'CASE-1' }),
        task('T-3', 'W-1'),
        task('T-4', 'W-1'),
      ],
    })

    const cases = model.groups[0].cases
    expect(cases).toHaveLength(3)
    expect(cases.find((item) => item.key === 'case:CASE-1')?.tasks).toHaveLength(2)
    expect(cases.find((item) => item.key === 'task:T-3')).toMatchObject({
      caseId: null,
      source: 'task-fallback',
    })
    expect(cases.find((item) => item.key === 'task:T-4')).toMatchObject({
      caseId: null,
      source: 'task-fallback',
    })
    expect(getWorkInboxCaseProgress(cases.find((item) => item.key === 'case:CASE-1')!)).toEqual({
      completed: 0,
      total: 2,
    })
  })

  it('ranks tasks by actionable status, due date, and task id', () => {
    const values = [
      task('T-4', 'W-1', {
        status: 'WAITING_WORKER',
        due_date: '2026-01-01',
      }),
      task('T-1', 'W-1', {
        status: 'READY_FOR_REVIEW',
        due_date: null,
      }),
      task('T-3', 'W-1', {
        status: 'READY_FOR_REVIEW',
        due_date: '2026-08-01',
      }),
      task('T-2', 'W-1', {
        status: 'READY_FOR_REVIEW',
        due_date: '2026-08-01',
      }),
    ]

    expect(
      values
        .map(inboxTask)
        .sort(compareWorkInboxTasks)
        .map((item) => item.task.task_id),
    ).toEqual(['T-2', 'T-3', 'T-1', 'T-4'])
  })

  it('ranks worker groups by their highest-priority task independently of response order', () => {
    const model = buildWorkInboxModel({
      workers: [worker('W-3'), worker('W-1'), worker('W-2')],
      tasks: [
        task('T-3', 'W-3', { status: 'WAITING_EXTERNAL', due_date: '2026-07-01' }),
        task('T-1', 'W-1', { status: 'READY_FOR_REVIEW', due_date: '2026-08-10' }),
        task('T-2', 'W-2', { status: 'READY_FOR_REVIEW', due_date: '2026-08-01' }),
      ],
    })

    expect(model.groups.map((group) => group.worker.worker_id)).toEqual(['W-2', 'W-1', 'W-3'])
  })

  it('normalizes Unicode, letter case, and whitespace when searching all supported fields', () => {
    const workers = [worker('W-1', '김 민지'), worker('W-2', 'Nguyen An')]
    const tasks = [
      task('T-1', 'W-1', {
        title: '체류 기간 연장',
        workflow_id: 'wf-visa',
      }),
      task('T-2', 'W-2', {
        case_id: 'CASE-CONTRACT-2',
        title: '계약 검토',
        workflow_id: 'wf-contract',
      }),
    ]
    const workflowNameById = new Map([
      ['wf-visa', 'Visa Renewal'],
      ['wf-contract', 'Contract Review'],
    ])

    const combinedResult = buildWorkInboxModel({
      workers,
      tasks,
      workflowNameById,
      query: '  ＶＩＳＡ   김  ',
    })
    const taskTitleResult = buildWorkInboxModel({
      workers,
      tasks,
      workflowNameById,
      query: '기간 연장',
    })
    const workerNameResult = buildWorkInboxModel({
      workers,
      tasks,
      workflowNameById,
      query: 'nguyen',
    })
    const caseIdResult = buildWorkInboxModel({
      workers,
      tasks,
      workflowNameById,
      query: 'case-contract',
    })

    expect(normalizeWorkInboxSearch('  ＶＩＳＡ   김  ')).toBe('visa 김')
    expect(combinedResult.groups.map((group) => group.worker.worker_id)).toEqual(['W-1'])
    expect(taskTitleResult.groups.map((group) => group.worker.worker_id)).toEqual(['W-1'])
    expect(workerNameResult.groups.map((group) => group.worker.worker_id)).toEqual(['W-2'])
    expect(caseIdResult.groups.map((group) => group.worker.worker_id)).toEqual(['W-2'])
  })

  it('supports deterministic due-date and worker-name sorting', () => {
    const input = {
      workers: [worker('W-1', '파티마'), worker('W-2', '김민지')],
      tasks: [
        task('T-1', 'W-1', { status: 'READY_FOR_REVIEW', due_date: '2026-08-20' }),
        task('T-2', 'W-2', { status: 'DRAFT', due_date: '2026-08-01' }),
      ],
    }

    const dueDate = buildWorkInboxModel({ ...input, sort: 'due-date' })
    const workerName = buildWorkInboxModel({ ...input, sort: 'worker-name' })

    expect(dueDate.groups.map((group) => group.worker.worker_id)).toEqual(['W-2', 'W-1'])
    expect(workerName.groups.map((group) => group.worker.worker_id)).toEqual(['W-2', 'W-1'])
  })

  it('calculates case progress from completed tasks over every task in the case', () => {
    const model = buildWorkInboxModel({
      workers: [worker('W-1')],
      tasks: [
        task('T-1', 'W-1', { case_id: 'CASE-1', status: 'COMPLETED' }),
        task('T-2', 'W-1', { case_id: 'CASE-1', status: 'DRAFT' }),
        task('T-3', 'W-1', { case_id: 'CASE-1', status: 'CANCELLED' }),
      ],
    })

    expect(getWorkInboxCaseProgress(model.groups[0].primaryCase)).toEqual({
      completed: 1,
      total: 3,
    })
  })

  it('selects the requested visible worker and falls back to the first match', () => {
    const input = {
      workers: [worker('W-1', '김민지'), worker('W-2', '응우옌 안')],
      tasks: [
        task('T-1', 'W-1', { status: 'WAITING_WORKER' }),
        task('T-2', 'W-2', { status: 'READY_FOR_REVIEW' }),
      ],
    }

    const requested = buildWorkInboxModel({
      ...input,
      selectedWorkerId: 'W-1',
    })
    const filtered = buildWorkInboxModel({
      ...input,
      selectedWorkerId: 'W-1',
      query: '응우옌',
    })

    expect(requested.selectedGroup?.worker.worker_id).toBe('W-1')
    expect(requested.selectedWorker?.worker_id).toBe('W-1')
    expect(filtered.selectedGroup?.worker.worker_id).toBe('W-2')
    expect(filtered.selectedWorker?.worker_id).toBe('W-2')
  })
})
