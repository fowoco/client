import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelTask, createTask, fetchTaskById, fetchTasks, updateChecklistItem, updateTask } from './tasks'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchTasks', () => {
  it('requests /tasks with default pagination', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ items: [], page: 0, size: 100, total_elements: 0, total_pages: 0 }),
    )

    await fetchTasks()

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/tasks?page=0&size=100')
  })

  it('adds filters when given', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ items: [], page: 0, size: 20, total_elements: 0, total_pages: 0 }),
    )

    await fetchTasks({
      status: 'READY_FOR_REVIEW',
      targetType: 'COMPANY',
      source: 'SYSTEM_DDAY',
      caseId: 'CASE-17',
      keyword: '체류연장',
      page: 1,
      size: 20,
    })

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('status=READY_FOR_REVIEW')
    expect(url).toContain('target_type=COMPANY')
    expect(url).toContain('source=SYSTEM_DDAY')
    expect(url).toContain('case_id=CASE-17')
    expect(url).not.toContain('caseId=')
    expect(url).toContain('keyword=%EC%B2%B4%EB%A5%98%EC%97%B0%EC%9E%A5')
    expect(url).toContain('page=1&size=20')
  })
})

describe('fetchTaskById', () => {
  it('requests /tasks/{id}', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ task_id: 'T-1' }))

    await fetchTaskById('T-1')

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/tasks/T-1')
  })
})

describe('createTask', () => {
  it('POSTs the task body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ task_id: 'T-1' }, 201))

    await createTask({
      worker_id: 'W-1',
      task_type: 'STAY_PERIOD_EXTENSION',
      workflow_id: 'wf-stay-extension',
      title: '체류연장 준비',
    })

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({
      worker_id: 'W-1',
      task_type: 'STAY_PERIOD_EXTENSION',
      workflow_id: 'wf-stay-extension',
      title: '체류연장 준비',
    })
  })

  it('supports a company task without worker_id', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ task_id: 'T-company' }, 201))

    await createTask({
      target_type: 'COMPANY',
      task_type: 'PAYROLL_EXPLANATION',
      workflow_id: 'wf-payroll-explanation',
      title: '급여명세서 설명 준비',
    })

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect(JSON.parse(init?.body as string)).toEqual({
      target_type: 'COMPANY',
      task_type: 'PAYROLL_EXPLANATION',
      workflow_id: 'wf-payroll-explanation',
      title: '급여명세서 설명 준비',
    })
  })
})

describe('updateTask', () => {
  it('PATCHes /tasks/{id} with expected_version', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ task_id: 'T-1' }))

    await updateTask('T-1', { title: '수정된 제목', business_data: {}, expected_version: 2 })

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/tasks/T-1')
    expect(init?.method).toBe('PATCH')
  })
})

describe('updateChecklistItem', () => {
  it('PATCHes the checklist item path', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ task_id: 'T-1' }))

    await updateChecklistItem('T-1', 'item-1', {
      completed: true,
      expected_version: 1,
      expected_task_version: 3,
    })

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/tasks/T-1/checklist-items/item-1')
  })
})

describe('cancelTask', () => {
  it('POSTs to /tasks/{id}/cancel', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ task_id: 'T-1' }))

    await cancelTask('T-1', { expected_version: 3, reason: '중복 등록' })

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/tasks/T-1/cancel')
    expect(init?.method).toBe('POST')
  })
})
