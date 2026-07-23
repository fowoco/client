import styles from './EmptyState.module.css'

export type EmptyStateKind = 'empty' | 'loading' | 'error'

export interface EmptyStateProps {
  kind?: EmptyStateKind
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ kind = 'empty', title, body, actionLabel, onAction }: EmptyStateProps) {
  const isError = kind === 'error'
  const isLoading = kind === 'loading'
  return (
    <div className={`${styles.state} ${isLoading ? styles.loading : ''}`}>
      <p className={`${styles.title} ${isError ? styles.titleError : ''}`}>{title}</p>
      <p className={styles.body}>{body}</p>
      {actionLabel && (
        <button
          type="button"
          className={`${styles.action} ${isError ? styles.actionError : ''}`}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
