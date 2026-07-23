import type { CSSProperties, ReactNode } from 'react'
import styles from './ListRow.module.css'

export interface ListRowProps {
  /** 이 행의 `grid-template-columns` 값. 페이지마다 컬럼 구성이 달라 직접 지정한다. */
  columns: string
  children: ReactNode
}

export function ListRow({ columns, children }: ListRowProps) {
  const style: CSSProperties = { gridTemplateColumns: columns }
  return (
    <div className={styles.row} style={style}>
      {children}
    </div>
  )
}
