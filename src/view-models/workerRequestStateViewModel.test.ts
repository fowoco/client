import { describe, expect, it } from 'vitest'
import { getWorkerRequestStateViewModel } from './workerRequestStateViewModel'

describe('getWorkerRequestStateViewModel', () => {
  it('maps the four operational states without inferring transmission from registration', () => {
    expect(getWorkerRequestStateViewModel({}).label).toBe('서류대기')
    expect(getWorkerRequestStateViewModel({ requestSentAt: '2026-08-04T01:00:00Z' }).label).toBe('요청전송')
    expect(getWorkerRequestStateViewModel({
      requestSentAt: '2026-08-04T01:00:00Z', responseReceivedAt: '2026-08-04T02:00:00Z',
    }).label).toBe('승인대기')
    expect(getWorkerRequestStateViewModel({ completedAt: '2026-08-04T03:00:00Z' }).label).toBe('완료')
  })
})
