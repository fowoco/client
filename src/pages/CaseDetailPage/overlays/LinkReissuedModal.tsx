import { useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import { useToastStore } from '../../../store/toastStore'
import { getWorkerRequestStateViewModel } from '../../../view-models/workerRequestStateViewModel'
import type { ReissueSubmission } from './LinkReissueModal'
import styles from './overlays.module.css'

export interface LinkReissuedModalProps {
  open: boolean
  submission: ReissueSubmission | null
  workerUrl: string | null
  expiresAt: string | null
  canRecordDelivery: boolean
  onRecordDelivery: () => void
  canSendSms: boolean
  smsSending: boolean
  smsStatusMessage: string | null
  onSendSms: (recipientPhone: string) => void
  onClose: () => void
}

export function LinkReissuedModal({
  open,
  submission,
  workerUrl,
  expiresAt,
  canRecordDelivery,
  onRecordDelivery,
  canSendSms,
  smsSending,
  smsStatusMessage,
  onSendSms,
  onClose,
}: LinkReissuedModalProps) {
  const showToast = useToastStore((state) => state.showToast)
  const requestState = getWorkerRequestStateViewModel({})
  const [recipientPhone, setRecipientPhone] = useState('')

  async function handleCopyLink() {
    if (!workerUrl) return
    try {
      await navigator.clipboard.writeText(workerUrl)
      showToast('링크를 복사했습니다.')
    } catch {
      showToast('복사에 실패했습니다. 직접 선택해 복사해 주세요.')
    }
  }

  function handleSendSms() {
    if (!canSendSms || smsSending || !recipientPhone.trim()) return
    onSendSms(recipientPhone.trim())
  }

  return (
    <Modal open={open} onClose={onClose} title="새 링크가 준비되었습니다" size="wide">
      <p className={styles.description}>문자로 바로 보내거나, 링크를 복사해 직접 전달해 주세요.</p>

      <p className={styles.readyBanner}>
        ✓ {requestState.label} · {submission?.expiry} ·{' '}
        {expiresAt ? new Date(expiresAt).toLocaleString('ko-KR') : '만료시각 확인 필요'}까지
      </p>

      <div className={styles.plainRow}>
        <span className={styles.plainValue}>{workerUrl ?? '링크 확인 필요'}</span>
        <button type="button" className={styles.textLink} onClick={handleCopyLink}>
          복사
        </button>
      </div>

      {canSendSms && (
        <div className={styles.plainRow}>
          <input
            type="tel"
            className={styles.textInput}
            placeholder="01012345678"
            value={recipientPhone}
            onChange={(event) => setRecipientPhone(event.target.value)}
            disabled={smsSending}
            aria-label="근로자 휴대전화 번호"
          />
          <button
            type="button"
            className={styles.textLink}
            onClick={handleSendSms}
            disabled={smsSending || !recipientPhone.trim()}
          >
            {smsSending ? '발송 중…' : '문자로 보내기'}
          </button>
        </div>
      )}
      {smsStatusMessage && <p className={styles.policyBannerText}>{smsStatusMessage}</p>}

      <p className={styles.fieldLabel}>재발급 사유</p>
      <p className={styles.plainValue}>{submission?.reason}</p>

      <div className={styles.policyBanner}>
        <p className={styles.policyBannerText}>
          {requestState.description} SMS·메신저로 직접 전달해 주세요.
        </p>
      </div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onClose}>
          닫기
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onRecordDelivery}
          disabled={!canRecordDelivery}
        >
          전달 완료 기록
        </button>
      </div>
    </Modal>
  )
}
