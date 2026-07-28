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

/** stay_expiry_date(YYYY-MM-DD) 같은 날짜 문자열과 오늘 사이의 일수를 계산한다. null이면 만료일이 없다는 뜻. */
export function daysUntil(dateString: string | null): number | null {
  if (!dateString) return null
  const target = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
