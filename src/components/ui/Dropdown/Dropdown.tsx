import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import styles from './Dropdown.module.css'

export interface DropdownOption {
  value: string
  label: string
}

export interface DropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
  /** 트리거 너비. 라벨이 긴 옵션이 있을 때 기본값(180px) 대신 지정한다. */
  width?: string
}

let dropdownIdCounter = 0

export function Dropdown({ options, value, onChange, ariaLabel, className, width }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const instanceId = useRef(`dropdown-${++dropdownIdCounter}`).current

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selectedLabel = options[selectedIndex]?.label ?? ''

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (open) listRef.current?.focus()
  }, [open])

  function openList() {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  function closeListAndRefocusTrigger() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  function selectOption(option: DropdownOption) {
    onChange(option.value)
    closeListAndRefocusTrigger()
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openList()
    }
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeListAndRefocusTrigger()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const option = options[activeIndex]
      if (option) selectOption(option)
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${className ?? ''}`}
      style={width ? { width } : undefined}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? closeListAndRefocusTrigger() : openList())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={styles.label}>{selectedLabel}</span>
        <span className={`${styles.arrow} ${open ? styles.arrowOpen : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          className={styles.list}
          role="listbox"
          aria-label={ariaLabel}
          aria-activedescendant={`${instanceId}-option-${activeIndex}`}
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
        >
          {options.map((option, index) => (
            <li key={option.value} role="presentation">
              <button
                id={`${instanceId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`${styles.option} ${
                  index === activeIndex ? styles.optionActive : ''
                } ${option.value === value ? styles.optionSelected : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
