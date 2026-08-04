import type { ChangeEvent } from 'react'
import searchIcon from './search.svg'
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
    <label className={`${styles.field} ${className ?? ''}`}>
      <img className={styles.icon} src={searchIcon} alt="" aria-hidden="true" />
      <input
        className={styles.search}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        aria-label={ariaLabel}
      />
    </label>
  )
}
