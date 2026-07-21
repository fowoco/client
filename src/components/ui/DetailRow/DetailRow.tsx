import type { ReactNode } from 'react'
import styles from './DetailRow.module.css'

export type DetailRowTone = 'default' | 'warning' | 'critical' | 'success'

const VALUE_TONE_CLASS: Record<DetailRowTone, string> = {
  default: '',
  warning: styles.valueWarning,
  critical: styles.valueCritical,
  success: styles.valueSuccess,
}

export interface DetailRowProps {
  label: string
  value: ReactNode
  tone?: DetailRowTone
}

export function DetailRow({ label, value, tone = 'default' }: DetailRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ${VALUE_TONE_CLASS[tone]}`}>{value}</span>
    </div>
  )
}
