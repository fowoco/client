import { Modal } from '../../../components/ui/Modal/Modal'
import { APPROVAL_SNAPSHOT } from '../caseDetailData'
import styles from './overlays.module.css'

export interface ApprovalDecisionModalProps {
  open: boolean
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}

export function ApprovalDecisionModal({ open, onClose, onApprove, onReject }: ApprovalDecisionModalProps) {
  function handleEditThenApprove() {
    // TODO(backend): 승인본 내용을 수정한 뒤 승인하는 흐름. PATCH API 계약이 정해지면 구현한다.
  }

  return (
    <Modal open={open} onClose={onClose} title="승인 요청을 검토하세요" size="wide">
      <p className={styles.description}>
        요청자 {APPROVAL_SNAPSHOT.requester} · {APPROVAL_SNAPSHOT.requestedAt} · 승인 대기
      </p>

      <div className={styles.snapshotCard}>
        <p className={styles.snapshotTitle}>승인본 V1 · 핵심 내용 Snapshot</p>
        {APPROVAL_SNAPSHOT.rows.map((row) => (
          <div key={row.label} className={styles.snapshotRow}>
            <span className={styles.snapshotLabel}>{row.label}</span>
            <span className={styles.snapshotValue}>{row.value}</span>
          </div>
        ))}
      </div>

      <p className={styles.diffNote}>{APPROVAL_SNAPSHOT.diffNote} ▾</p>

      <div className={styles.policyBanner}>
        <p className={styles.policyBannerText}>{APPROVAL_SNAPSHOT.decisionPolicy}</p>
      </div>

      <div className={styles.decisionActionRow}>
        <button type="button" className={styles.rejectButton} onClick={onReject}>
          반려
        </button>
        <button type="button" className={styles.textLink} onClick={handleEditThenApprove}>
          수정 후 승인
        </button>
        <button type="button" className={styles.primaryButton} onClick={onApprove}>
          승인
        </button>
      </div>
    </Modal>
  )
}
