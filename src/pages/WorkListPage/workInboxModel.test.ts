import { describe, expect, it } from 'vitest'
import type { CasePriority, CaseSummaryResponse, CaseTaskResponse } from '../../api/cases'
import type { WorkerResponse } from '../../api/workers'
import { buildWorkInboxModel, compareWorkInboxCases, normalizeWorkInboxSearch } from './workInboxModel'

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

function currentTask(taskId: string, overrides: Partial<CaseTaskResponse> = {}): CaseTaskResponse {
  return {
    task_id: taskId,
    task_type: 'STAY_PERIOD_EXTENSION',
    title: `업무 ${taskId}`,
    status: 'DRAFT',
    due_date: null,
    ...overrides,
  }
}

function caseSummary(
  caseId: string,
  workerId: string,
  workerDisplayName = `근로자 ${workerId}`,
  overrides: Partial<CaseSummaryResponse> = {},
): CaseSummaryResponse {
  return {
    case_id: caseId,
    worker_id: workerId,
    worker_display_name: workerDisplayName,
    title: `Case ${caseId}`,
    display_status: 'DOCUMENT_PENDING',
    has_unread_response: false,
    priority: 'NORMAL',
    progress: { completed_steps: 0, total_steps: 1, percentage: 0 },
    due_date: null,
    current_task: currentTask(`T-${caseId}`),
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function priorityCase(caseId: string, priority: CasePriority, dueDate: string | null = null) {
  return caseSummary(caseId, 'W-1', undefined, { priority, due_date: dueDate })
}

describe('workInboxModel', () => {
  it('groups cases by worker id using the worker info embedded in each case', () => {
    const model = buildWorkInboxModel({
      workers: [worker('W-1'), worker('W-2')],
      cases: [caseSummary('CASE-1', 'W-1'), caseSummary('CASE-2', 'W-2')],
    })

    expect(model.groups.map((group) => group.workerId).sort()).toEqual(['W-1', 'W-2'])
  })

  it('returns no worker groups when there are no cases', () => {
    const model = buildWorkInboxModel({
      workers: [worker('W-1')],
      cases: [],
    })

    expect(model.allGroups).toEqual([])
    expect(model.groups).toEqual([])
    expect(model.selectedGroup).toBeNull()
  })

  it('keeps worker as null when /workers does not include the case owner, without dropping the case', () => {
    const model = buildWorkInboxModel({
      workers: [],
      cases: [caseSummary('CASE-1', 'W-missing', '응우옌 안')],
    })

    expect(model.groups).toHaveLength(1)
    expect(model.groups[0].worker).toBeNull()
    expect(model.groups[0].workerDisplayName).toBe('응우옌 안')
  })

  it('groups every case for the same worker together and picks the highest-priority one first', () => {
    const model = buildWorkInboxModel({
      workers: [worker('W-1')],
      cases: [
        caseSummary('CASE-1', 'W-1', undefined, { priority: 'NORMAL' }),
        caseSummary('CASE-2', 'W-1', undefined, { priority: 'URGENT' }),
        caseSummary('CASE-3', 'W-1', undefined, { priority: 'LOW' }),
      ],
    })

    expect(model.groups[0].cases).toHaveLength(3)
    expect(model.groups[0].primaryCase.case_id).toBe('CASE-2')
  })

  it('ranks cases by priority, due date, then case id', () => {
    const values = [
      priorityCase('C-4', 'NORMAL', '2026-01-01'),
      priorityCase('C-1', 'URGENT', null),
      priorityCase('C-3', 'URGENT', '2026-08-01'),
      priorityCase('C-2', 'URGENT', '2026-08-01'),
    ]

    expect(values.sort(compareWorkInboxCases).map((item) => item.case_id)).toEqual([
      'C-2',
      'C-3',
      'C-1',
      'C-4',
    ])
  })

  it('ranks worker groups by their highest-priority case independently of response order', () => {
    const model = buildWorkInboxModel({
      workers: [worker('W-3'), worker('W-1'), worker('W-2')],
      cases: [
        caseSummary('C-3', 'W-3', undefined, { priority: 'LOW', due_date: '2026-07-01' }),
        caseSummary('C-1', 'W-1', undefined, { priority: 'HIGH', due_date: '2026-08-10' }),
        caseSummary('C-2', 'W-2', undefined, { priority: 'URGENT', due_date: '2026-08-01' }),
      ],
    })

    expect(model.groups.map((group) => group.workerId)).toEqual(['W-2', 'W-1', 'W-3'])
  })

  it('normalizes Unicode, letter case, and whitespace when searching all supported fields', () => {
    const workers = [worker('W-1', '김 민지'), worker('W-2', 'Nguyen An')]
    const cases = [
      caseSummary('C-1', 'W-1', '김 민지', {
        title: '체류 기간 연장',
        current_task: currentTask('T-1', { title: '체류 기간 연장' }),
      }),
      caseSummary('C-2', 'W-2', 'Nguyen An', {
        title: '계약 검토',
        current_task: currentTask('T-2', { title: '계약 검토' }),
      }),
    ]

    const titleResult = buildWorkInboxModel({ workers, cases, query: '기간 연장' })
    const workerNameResult = buildWorkInboxModel({ workers, cases, query: 'nguyen' })

    expect(normalizeWorkInboxSearch('  ＶＩＳＡ   김  ')).toBe('visa 김')
    expect(titleResult.groups.map((group) => group.workerId)).toEqual(['W-1'])
    expect(workerNameResult.groups.map((group) => group.workerId)).toEqual(['W-2'])
  })

  it('supports deterministic due-date and worker-name sorting', () => {
    const input = {
      workers: [worker('W-1', '파티마'), worker('W-2', '김민지')],
      cases: [
        caseSummary('C-1', 'W-1', '파티마', { priority: 'HIGH' as CasePriority, due_date: '2026-08-20' }),
        caseSummary('C-2', 'W-2', '김민지', { priority: 'LOW' as CasePriority, due_date: '2026-08-01' }),
      ],
    }

    const dueDate = buildWorkInboxModel({ ...input, sort: 'due-date' })
    const workerName = buildWorkInboxModel({ ...input, sort: 'worker-name' })

    expect(dueDate.groups.map((group) => group.workerId)).toEqual(['W-2', 'W-1'])
    expect(workerName.groups.map((group) => group.workerId)).toEqual(['W-2', 'W-1'])
  })

  it('selects the requested visible worker and falls back to the first match', () => {
    const input = {
      workers: [worker('W-1', '김민지'), worker('W-2', '응우옌 안')],
      cases: [
        caseSummary('C-1', 'W-1', '김민지', { priority: 'LOW' as CasePriority }),
        caseSummary('C-2', 'W-2', '응우옌 안', { priority: 'HIGH' as CasePriority }),
      ],
    }

    const requested = buildWorkInboxModel({ ...input, selectedWorkerId: 'W-1' })
    const filtered = buildWorkInboxModel({ ...input, selectedWorkerId: 'W-1', query: '응우옌' })

    expect(requested.selectedGroup?.workerId).toBe('W-1')
    expect(filtered.selectedGroup?.workerId).toBe('W-2')
  })
})
