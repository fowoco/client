import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  /** true면 버튼을 비활성화하고 처리중 스피너를 보여준다. */
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  isLoading = false,
  className,
  type = 'button',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const variantClass = variant === 'primary' ? styles.primary : styles.secondary
  return (
    <button
      type={type}
      className={`${styles.button} ${variantClass} ${isLoading ? styles.loading : ''} ${className ?? ''}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}
