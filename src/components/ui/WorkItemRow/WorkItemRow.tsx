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
  workerLabel?: string | null
  meta?: string
  statusLabel?: string
  statusTone?: WorkItemStatusTone
  detailItems?: string[]
  nextActor?: string
  nextAction: string
  urgency?: WorkItemUrgency
  variant?: 'card' | 'flat'
  onClick?: () => void
  onEvidenceClick?: () => void
}

export function WorkItemRow({
  title,
  workerLabel,
  meta,
  statusLabel,
  statusTone = 'neutral',
  detailItems = [],
  nextActor,
  nextAction,
  urgency = 'warning',
  variant = 'card',
  onClick,
  onEvidenceClick,
}: WorkItemRowProps) {
  return (
    <article
      className={`${styles.row} ${variant === 'flat' ? styles.rowFlat : ''}`}
      aria-label={`${workerLabel ?? '근로자'} ${title}`}
    >
      <span className={`${styles.rail} ${RAIL_CLASS[urgency]}`} aria-hidden="true" />
      <span className={styles.content}>
        <span className={styles.titleLine}>
          {workerLabel !== undefined && (
            <span className={`${styles.worker} ${workerLabel ? '' : styles.workerMissing}`}>
              {workerLabel ?? '근로자 이름 미제공'}
            </span>
          )}
          <span className={styles.title}>{title}</span>
        </span>
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
        {nextActor && (
          <span className={styles.actor}>
            다음 행동 주체 <strong>{nextActor}</strong>
          </span>
        )}
      </span>
      <span className={styles.actions}>
        {onEvidenceClick && (
          <button type="button" className={styles.evidence} onClick={onEvidenceClick}>
            근거 보기
          </button>
        )}
        <button type="button" className={styles.next} onClick={onClick}>
          {nextAction}
        </button>
      </span>
    </article>
  )
}
