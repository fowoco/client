import type { ChangeEvent } from 'react'
import styles from './SearchInput.module.css'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  ariaLabel: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: SearchInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value)
  }

  return (
    <input
      className={`${styles.search} ${className ?? ''}`}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      aria-label={ariaLabel}
    />
  )
}
