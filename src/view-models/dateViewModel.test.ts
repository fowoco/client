import { describe, expect, it, vi } from 'vitest'
import { getOperationalDateViewModel } from './dateViewModel'

describe('getOperationalDateViewModel', () => {
  it('keeps the date meaning visible when a value is missing', () => {
    expect(getOperationalDateViewModel('STAY_EXPIRY', null)).toMatchObject({
      label: '체류 만료일',
      display: '체류 만료일 미등록',
      missing: true,
    })
    expect(getOperationalDateViewModel('TASK_DUE', null).display).toBe('업무 마감일 미등록')
  })

  it('formats a document expiry date with a relative deadline', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 4, 9))

    expect(getOperationalDateViewModel('DOCUMENT_EXPIRY', '2026-08-10')).toMatchObject({
      value: '2026.08.10',
      relative: 'D-6',
      display: '2026.08.10 · D-6',
      tone: 'critical',
    })

    vi.useRealTimers()
  })
})
