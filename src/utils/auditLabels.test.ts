import { describe, expect, it } from 'vitest'
import { getAuditActionLabel } from './auditLabels'

describe('getAuditActionLabel', () => {
  it('labels the extended server audit actions', () => {
    expect(getAuditActionLabel('AI_RUN_CANDIDATES_DECIDED')).toBe(
      'Agent 업무 후보를 확정했습니다.',
    )
    expect(getAuditActionLabel('WORKER_LINK_RESPONSES_REVIEWED')).toBe(
      '근로자 응답을 확인했습니다.',
    )
    expect(getAuditActionLabel('WORKER_LINK_SENT')).toBe(
      '근로자에게 모바일 링크를 전달했습니다.',
    )
  })

  it('shows a safe fallback for a future server action', () => {
    expect(getAuditActionLabel('NEW_SERVER_EVENT')).toBe(
      '시스템 이벤트(NEW_SERVER_EVENT)가 기록되었습니다.',
    )
  })
})
