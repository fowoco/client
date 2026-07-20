import type { ReactNode } from 'react'
import styles from './MobileShell.module.css'

export interface MobileShellProps {
  children: ReactNode
  onBack?: () => void
  title?: string
  right?: ReactNode
  expired?: boolean
}

export function MobileShell({ children, onBack, title, right, expired }: MobileShellProps) {
  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <header className={styles.header}>
          {onBack && (
            <button type="button" className={styles.back} onClick={onBack} aria-label="뒤로 가기">
              ←
            </button>
          )}
          {title ? (
            <p className={styles.title}>{title}</p>
          ) : (
            <p className={styles.brand}>FOWOCO</p>
          )}
          {expired ? <span className={styles.expiredBadge}>만료</span> : right}
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
