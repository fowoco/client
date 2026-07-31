import styles from './EmptyState.module.css'

export type EmptyStateKind = 'empty' | 'loading' | 'error'

export interface EmptyStateProps {
  kind?: EmptyStateKind
  title: string
  body: string
  /** 클릭 동작이 없는 보조 캡션 — 로딩 상태의 "처리 중 · 중복 실행 차단" 같은 상태 표시용. */
  note?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ kind = 'empty', title, body, note, actionLabel, onAction }: EmptyStateProps) {
  const isError = kind === 'error'
  const isLoading = kind === 'loading'
  return (
    <div className={`${styles.state} ${isLoading ? styles.loading : ''}`}>
      <p className={`${styles.title} ${isError ? styles.titleError : ''}`}>{title}</p>
      <p className={styles.body}>{body}</p>
      {note && <p className={styles.note}>{note}</p>}
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
