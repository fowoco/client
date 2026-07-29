import { useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import type { ImportRow } from './importWizardData'
import styles from './importWizard.module.css'

export type ConflictChoice = 'existing' | 'imported'

export interface ConflictResolverModalProps {
  open: boolean
  row: ImportRow | null
  onClose: () => void
  onResolve: (rowId: string, choice: ConflictChoice) => void
}

export function ConflictResolverModal({ open, row, onClose, onResolve }: ConflictResolverModalProps) {
  const [choice, setChoice] = useState<ConflictChoice>('imported')

  function handleApply() {
    if (!row) return
    onResolve(row.id, choice)
    setChoice('imported')
  }

  if (!row) return null

  return (
    <Modal open={open} onClose={onClose} title="체류만료일 충돌 해결">
      <p className={styles.description}>
        {row.workerName}님의 체류만료일이 이미 등록된 값과 다릅니다. 어느 값을 사용할지 선택하세요.
      </p>

      <div className={styles.compareGrid}>
        <button
          type="button"
          className={`${styles.compareCard} ${choice === 'existing' ? styles.compareCardSelected : ''}`}
          onClick={() => setChoice('existing')}
        >
          <p className={styles.compareLabel}>기존 값</p>
          <p className={styles.compareValue}>{row.existingStayExpiry}</p>
        </button>
        <button
          type="button"
          className={`${styles.compareCard} ${choice === 'imported' ? styles.compareCardSelected : ''}`}
          onClick={() => setChoice('imported')}
        >
          <p className={styles.compareLabel}>가져온 값</p>
          <p className={styles.compareValue}>{row.importedStayExpiry}</p>
        </button>
      </div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onClose}>
          취소
        </button>
        <button type="button" className={styles.primaryButton} onClick={handleApply}>
          이 값 적용
        </button>
      </div>
    </Modal>
  )
}
