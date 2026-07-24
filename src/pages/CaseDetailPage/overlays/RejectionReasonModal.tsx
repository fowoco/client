import { useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import styles from './overlays.module.css'

const MAX_LENGTH = 500

export interface RejectionReasonModalProps {
  open: boolean
  onBack: () => void
  onConfirm: (reason: string) => void
}

export function RejectionReasonModal({ open, onBack, onConfirm }: RejectionReasonModalProps) {
  const [reason, setReason] = useState('')

  function handleConfirm() {
    if (reason.trim() === '') return
    onConfirm(reason)
    setReason('')
  }

  return (
    <Modal open={open} onClose={onBack} title="반려 사유를 입력하세요">
      <p className={styles.description}>요청자에게 수정이 필요한 내용을 구체적으로 알려 주세요.</p>

      <div className={styles.reasonBox}>
        <textarea
          className={styles.reasonTextarea}
          value={reason}
          maxLength={MAX_LENGTH}
          onChange={(event) => setReason(event.target.value)}
          placeholder="반려 사유를 입력하세요"
        />
        <p className={styles.reasonCounter}>
          {reason.length} / {MAX_LENGTH}
        </p>
      </div>

      <p className={styles.footnote}>반려 기록과 승인본 V1은 활동이력에 보존됩니다.</p>

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onBack}>
          돌아가기
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleConfirm}
          disabled={reason.trim() === ''}
        >
          반려 확정
        </button>
      </div>
    </Modal>
  )
}
