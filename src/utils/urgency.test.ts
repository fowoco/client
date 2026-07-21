import { describe, expect, it } from 'vitest'
import { getUrgencyTier, URGENCY_LABEL, URGENCY_TONE } from './urgency'

describe('getUrgencyTier', () => {
  it('returns urgent within 7 days', () => {
    expect(getUrgencyTier(0)).toBe('urgent')
    expect(getUrgencyTier(7)).toBe('urgent')
  })

  it('returns medium between 8 and 30 days', () => {
    expect(getUrgencyTier(8)).toBe('medium')
    expect(getUrgencyTier(30)).toBe('medium')
  })

  it('returns comfortable beyond 30 days', () => {
    expect(getUrgencyTier(31)).toBe('comfortable')
    expect(getUrgencyTier(90)).toBe('comfortable')
  })

  it('treats null as comfortable (no imminent deadline)', () => {
    expect(getUrgencyTier(null)).toBe('comfortable')
  })
})

describe('URGENCY_TONE / URGENCY_LABEL', () => {
  it('maps every tier to a tone and a Korean label', () => {
    for (const tier of ['urgent', 'medium', 'comfortable'] as const) {
      expect(URGENCY_TONE[tier]).toBeDefined()
      expect(URGENCY_LABEL[tier]).toBeDefined()
    }
  })
})
