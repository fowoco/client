import { describe, expect, it } from 'vitest'
import type { DashboardTaskSummaryResponse, UpcomingExpiryItemResponse } from '../../api/dashboard'
import { buildDashboardWorkItems } from './dashboardData'

const TASKS: DashboardTaskSummaryResponse[] = [
  {
    task_id: 'T-1',
    worker_id: 'W-1',
    title: '체류기간 연장 검토',
    status: 'READY_FOR_REVIEW',
    due_date: '2099-08-17',
  },
  {
    task_id: 'T-2',
    worker_id: 'W-2',
    title: '여권 사본 제출 대기',
    status: 'WAITING_WORKER',
    due_date: null,
  },
]

const EXPIRIES: UpcomingExpiryItemResponse[] = [
  {
    worker_id: 'W-1',
    display_name: '응웬반A',
    category: 'STAY_EXPIRY',
    expiry_date: '2099-08-20',
    document_type: null,
  },
]

describe('buildDashboardWorkItems', () => {
  it('reuses existing Today fields for deadline, actor, and worker context', () => {
    const [review] = buildDashboardWorkItems(TASKS, EXPIRIES)

    expect(review).toMatchObject({
      workerName: '응웬반A',
      nextActor: '담당자',
      nextAction: '승인 검토',
      group: 'actionable',
    })
    expect(review?.deadline).toMatch(/^처리 기한 2099\.08\.17 · D-/)
  })

  it('does not invent a worker name or deadline when the Server did not provide them', () => {
    const waiting = buildDashboardWorkItems(TASKS, EXPIRIES)[1]

    expect(waiting).toMatchObject({
      workerName: null,
      deadline: '처리 기한 미등록',
      nextActor: '근로자',
      nextAction: '요청 현황',
      group: 'waiting',
    })
  })
})
