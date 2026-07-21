import type { StatusTone } from '../components/ui/StatusLabel/StatusLabel'

export type UrgencyTier = 'urgent' | 'medium' | 'comfortable'

const URGENT_WITHIN_DAYS = 7
const MEDIUM_WITHIN_DAYS = 30

/** null은 임박한 기한이 없다는 뜻이라 항상 '여유'로 취급한다. */
export function getUrgencyTier(daysUntilDue: number | null): UrgencyTier {
  if (daysUntilDue === null) return 'comfortable'
  if (daysUntilDue <= URGENT_WITHIN_DAYS) return 'urgent'
  if (daysUntilDue <= MEDIUM_WITHIN_DAYS) return 'medium'
  return 'comfortable'
}

export const URGENCY_TONE: Record<UrgencyTier, StatusTone> = {
  urgent: 'critical',
  medium: 'warning',
  comfortable: 'success',
}

export const URGENCY_LABEL: Record<UrgencyTier, string> = {
  urgent: '긴급',
  medium: '중간',
  comfortable: '여유',
}
