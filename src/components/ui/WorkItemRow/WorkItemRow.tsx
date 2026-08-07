import styles from './WorkItemRow.module.css'

export type WorkItemUrgency = 'warning' | 'critical' | 'info' | 'neutral'

const RAIL_CLASS: Record<WorkItemUrgency, string> = {
  warning: '',
  critical: styles.railCritical,
  info: styles.railInfo,
  neutral: styles.railNeutral,
}

export type WorkItemStatusTone = 'warning' | 'primary' | 'neutral'

const STATUS_CLASS: Record<WorkItemStatusTone, string> = {
  warning: styles.statusWarning,
  primary: styles.statusPrimary,
  neutral: styles.statusNeutral,
}

export interface WorkItemRowProps {
  title: string
  meta?: string
  statusLabel?: string
  statusTone?: WorkItemStatusTone
  detailItems?: string[]
  nextAction: string
  urgency?: WorkItemUrgency
  onClick?: () => void
}

export function WorkItemRow({
  title,
  meta,
  statusLabel,
  statusTone = 'neutral',
  detailItems = [],
  nextAction,
  urgency = 'warning',
  onClick,
}: WorkItemRowProps) {
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      <span className={`${styles.rail} ${RAIL_CLASS[urgency]}`} aria-hidden="true" />
      <span className={styles.content}>
        <span className={styles.title}>{title}</span>
        {statusLabel || detailItems.length > 0 ? (
          <span className={styles.inlineMeta}>
            {statusLabel && (
              <span className={`${styles.status} ${STATUS_CLASS[statusTone]}`}>
                {statusLabel}
              </span>
            )}
            {detailItems.map((item) => (
              <span key={item} className={styles.detailItem}>
                {item}
              </span>
            ))}
          </span>
        ) : (
          <span className={styles.meta}>{meta}</span>
        )}
      </span>
      <span className={styles.next}>{nextAction}</span>
    </button>
  )
}
