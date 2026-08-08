import { useEffect, useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import styles from './overlays.module.css'

export interface LinkDeliveryConfirmModalProps {
  open: boolean
  submitting?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function LinkDeliveryConfirmModal({
  open,
  submitting = false,
  onClose,
  onConfirm,
}: LinkDeliveryConfirmModalProps) {
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!open) setConfirmed(false)
  }, [open])

  function handleConfirm() {
    if (!confirmed || submitting) return
    onConfirm()
  }

  return (
    <Modal open={open} onClose={onClose} title="링크 전달 완료 기록" size="wide">
      <p className={styles.description}>
        SMS나 메신저로 링크를 직접 전달한 경우에만 완료로 기록해 주세요.
      </p>

      <div className={styles.policyBanner}>
        <p className={styles.policyBannerText}>
          이 기록은 근로자의 실제 수신을 보장하지 않으며, 업무 상태와 감사 이력에 반영됩니다.
        </p>
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        <span>근로자에게 링크를 직접 전달했습니다.</span>
      </label>

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onClose} disabled={submitting}>
          취소
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleConfirm}
          disabled={!confirmed || submitting}
        >
          {submitting ? '기록 중…' : '전달 완료로 기록'}
        </button>
      </div>
    </Modal>
  )
}
