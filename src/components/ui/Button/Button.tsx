import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export function Button({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  const variantClass = variant === 'primary' ? styles.primary : styles.secondary
  return (
    <button
      type={type}
      className={`${styles.button} ${variantClass} ${className ?? ''}`}
      {...rest}
    />
  )
}
