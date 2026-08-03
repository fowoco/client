import { Modal } from '../../../components/ui/Modal/Modal'
import { useToastStore } from '../../../store/toastStore'
import type { ReissueSubmission } from './LinkReissueModal'
import styles from './overlays.module.css'

const DEMO_NEW_LINK = 'fowoco.kr/s/7K9P-****-Q2M4'

export interface LinkReissuedModalProps {
  open: boolean
  submission: ReissueSubmission | null
  onClose: () => void
}

export function LinkReissuedModal({ open, submission, onClose }: LinkReissuedModalProps) {
  const showToast = useToastStore((state) => state.showToast)

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(DEMO_NEW_LINK)
      showToast('링크를 복사했습니다.')
    } catch {
      showToast('복사에 실패했습니다. 직접 선택해 복사해 주세요.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="새 링크가 준비되었습니다" size="wide">
      <p className={styles.description}>
        자동 발송되지 않습니다. 링크를 복사해 직접 전달해 주세요.
      </p>

      <p className={styles.readyBanner}>
        ✓ 기존 링크 폐기 완료 · 새 링크만 유효 · {submission?.expiry}
      </p>

      <div className={styles.plainRow}>
        <span className={styles.plainValue}>{DEMO_NEW_LINK}</span>
        <button type="button" className={styles.textLink} onClick={handleCopyLink}>
          복사
        </button>
      </div>

      <p className={styles.fieldLabel}>재발급 사유</p>
      <p className={styles.plainValue}>{submission?.reason}</p>

      <div className={styles.policyBanner}>
        <p className={styles.policyBannerText}>SMS·메신저가 자동으로 발송된 것이 아닙니다.</p>
      </div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onClose}>
          닫기
        </button>
        <button type="button" className={styles.primaryButton} onClick={handleCopyLink}>
          새 링크 복사
        </button>
      </div>
    </Modal>
  )
}
