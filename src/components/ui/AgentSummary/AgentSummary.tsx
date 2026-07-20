import styles from './AgentSummary.module.css'

export interface AgentSummaryProps {
  headline: string
  body: string
  actionLabel: string
  onAction?: () => void
}

export function AgentSummary({ headline, body, actionLabel, onAction }: AgentSummaryProps) {
  return (
    <div className={styles.card}>
      <p className={styles.kicker}>AGENT가 준비한 다음 행동</p>
      <p className={styles.headline}>{headline}</p>
      <p className={styles.body}>{body}</p>
      <button type="button" className={styles.action} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  )
}
