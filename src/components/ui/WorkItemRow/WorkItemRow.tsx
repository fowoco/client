import styles from './WorkItemRow.module.css'

export type WorkItemUrgency = 'warning' | 'critical' | 'neutral'

const RAIL_CLASS: Record<WorkItemUrgency, string> = {
  warning: '',
  critical: styles.railCritical,
  neutral: styles.railNeutral,
}

export interface WorkItemRowProps {
  title: string
  meta: string
  nextAction: string
  urgency?: WorkItemUrgency
  onClick?: () => void
}

export function WorkItemRow({
  title,
  meta,
  nextAction,
  urgency = 'warning',
  onClick,
}: WorkItemRowProps) {
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      <span className={`${styles.rail} ${RAIL_CLASS[urgency]}`} aria-hidden="true" />
      <span className={styles.content}>
        <span className={styles.title}>{title}</span>
        <span className={styles.meta}>{meta}</span>
      </span>
      <span className={styles.next}>{nextAction}</span>
    </button>
  )
}
