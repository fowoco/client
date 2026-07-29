import { useEffect, useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import type { ImportRow } from './importWizardData'
import styles from './importWizard.module.css'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export interface FailedRowRetryModalProps {
  open: boolean
  row: ImportRow | null
  onClose: () => void
  onRetry: (rowId: string, correctedStayExpiry: string) => void
}

export function FailedRowRetryModal({ open, row, onClose, onRetry }: FailedRowRetryModalProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (row) setValue(row.importedStayExpiry)
  }, [row])

  function handleRetry() {
    if (!row) return
    if (!isValidDate(value)) {
      setError('YYYY-MM-DD 형식으로 입력해 주세요 (예: 2026-09-15).')
      return
    }
    onRetry(row.id, value)
    setError(null)
  }

  if (!row) return null

  return (
    <Modal open={open} onClose={onClose} title="행 재처리">
      <p className={styles.description}>
        {row.rowNumber}행 · {row.workerName} — 값을 수정하고 다시 시도하세요.
      </p>

      <div className={styles.errorBox}>{row.errorMessage}</div>

      <p className={styles.fieldLabel}>체류만료일</p>
      <input
        className={styles.textInput}
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setError(null)
        }}
        placeholder="YYYY-MM-DD"
      />
      {error && <p className={`${styles.errorBox} ${styles.errorBoxSpaced}`}>{error}</p>}

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onClose}>
          취소
        </button>
        <button type="button" className={styles.primaryButton} onClick={handleRetry}>
          다시 시도
        </button>
      </div>
    </Modal>
  )
}
