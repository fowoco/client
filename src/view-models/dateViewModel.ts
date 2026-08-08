import type { StatusTone } from '../components/ui/StatusLabel/StatusLabel'
import { daysUntil } from '../utils/urgency'

export type OperationalDateKind =
  | 'TASK_DUE'
  | 'STAY_EXPIRY'
  | 'CONTRACT_START'
  | 'CONTRACT_END'
  | 'EMPLOYMENT_PERMIT_END'
  | 'EMPLOYMENT_ACTIVITY_END'
  | 'DOCUMENT_EXPIRY'

export interface OperationalDateViewModel {
  kind: OperationalDateKind
  label: string
  value: string
  relative: string | null
  display: string
  tone: StatusTone
  missing: boolean
  expired: boolean
}

const DATE_LABEL: Record<OperationalDateKind, string> = {
  TASK_DUE: '업무 마감일',
  STAY_EXPIRY: '체류 만료일',
  CONTRACT_START: '근로계약 시작일',
  CONTRACT_END: '근로계약 종료일',
  EMPLOYMENT_PERMIT_END: '고용허가 종료일',
  EMPLOYMENT_ACTIVITY_END: '취업활동 종료일',
  DOCUMENT_EXPIRY: '문서 만료일',
}

function formatDate(date: string): string {
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return date
  return `${year}.${month}.${day}`
}

function getRelativeDate(days: number): string {
  if (days < 0) return `D+${Math.abs(days)}`
  if (days === 0) return '오늘'
  return `D-${days}`
}

export function getOperationalDateViewModel(
  kind: OperationalDateKind,
  date: string | null,
): OperationalDateViewModel {
  const label = DATE_LABEL[kind]
  if (!date) {
    return {
      kind,
      label,
      value: '미등록',
      relative: null,
      display: `${label} 미등록`,
      tone: 'neutral',
      missing: true,
      expired: false,
    }
  }

  const days = daysUntil(date)
  const relative = days === null ? null : getRelativeDate(days)
  const isStartDate = kind === 'CONTRACT_START'
  const expired = !isStartDate && days !== null && days < 0
  const tone: StatusTone = isStartDate
    ? 'neutral'
    : days !== null && days <= 7
      ? 'critical'
      : days !== null && days <= 30
        ? 'warning'
        : 'neutral'
  const value = formatDate(date)

  return {
    kind,
    label,
    value,
    relative,
    display: relative && !isStartDate ? `${value} · ${relative}` : value,
    tone,
    missing: false,
    expired,
  }
}
