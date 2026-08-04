import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TaskDetailResponse } from './tasks'
import {
  approveTask,
  buildTaskApprovalSnapshot,
  completeTask,
  recordTaskEvidence,
  rejectTask,
  requestTaskApproval,
} from './approvals'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function task(): TaskDetailResponse {
  return {
    task_id: 'T-1', worker_id: 'W-1', case_id: null, task_type: 'STAY_PERIOD_EXTENSION',
    workflow_id: 'wf-stay', workflow_catalog_version: '3', title: '체류기간 연장', description: '안내',
    business_data: { office: '수원' }, source: 'MANUAL', status: 'DRAFT', due_date: '2026-08-10',
    content_revision: 2, version: 7, missing_required_slots: [], checklist_items: [], created_by: 'U-1',
    updated_by: 'U-1', created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z',
  }
}

beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
afterEach(() => vi.unstubAllGlobals())

describe('approval APIs', () => {
  it('builds a server-compatible snapshot from the current Task version', () => {
    expect(buildTaskApprovalSnapshot(task())).toEqual({
      expected_version: 7,
      ai_snapshot: null,
      hr_snapshot: {
        worker_id: 'W-1', task_type: 'STAY_PERIOD_EXTENSION', workflow_id: 'wf-stay',
        title: '체류기간 연장', description: '안내', due_date: '2026-08-10', business_data: { office: '수원' },
      },
      changed_fields: ['task_content'],
      source_versions: { workflow_catalog_version: '3', content_revision: 2 },
    })
  })

  it('uses the approval, decision, evidence and completion endpoints', async () => {
    vi.mocked(fetch).mockImplementation(() => Promise.resolve(jsonResponse({ task_id: 'T-1' }, 201)))

    await requestTaskApproval('T-1', buildTaskApprovalSnapshot(task()))
    await approveTask('T-1', { expected_version: 8 })
    await rejectTask('T-1', { expected_version: 8, reason: '마감일 확인 필요' })
    await recordTaskEvidence('T-1', { evidence_type: 'RECEIPT', note: '접수번호 1234' })
    await completeTask('T-1', 9)

    const calls = vi.mocked(fetch).mock.calls
    expect(String(calls[0][0])).toContain('/tasks/T-1/approval-requests')
    expect(String(calls[1][0])).toContain('/tasks/T-1/approve')
    expect(String(calls[2][0])).toContain('/tasks/T-1/reject')
    expect(String(calls[3][0])).toContain('/tasks/T-1/evidence')
    expect(String(calls[4][0])).toContain('/tasks/T-1/complete')
    expect(JSON.parse(calls[4][1]?.body as string)).toEqual({ expected_version: 9 })
  })
})
