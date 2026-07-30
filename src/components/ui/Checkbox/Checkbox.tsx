import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './Checkbox.module.css'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  error?: string
}

export function Checkbox({ label, error, className, id, ...rest }: CheckboxProps) {
  return (
    <div className={styles.wrapper}>
      <label className={`${styles.row} ${className ?? ''}`} htmlFor={id}>
        <input id={id} type="checkbox" className={styles.input} {...rest} />
        <span className={styles.label}>{label}</span>
      </label>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
