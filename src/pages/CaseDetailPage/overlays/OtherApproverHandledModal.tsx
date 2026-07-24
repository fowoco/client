import { Modal } from '../../../components/ui/Modal/Modal'
import { OTHER_APPROVER_HANDLED } from '../caseDetailData'
import styles from './overlays.module.css'

export interface OtherApproverHandledModalProps {
  open: boolean
  onClose: () => void
}

export function OtherApproverHandledModal({ open, onClose }: OtherApproverHandledModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="다른 승인자가 처리했습니다" size="wide">
      <p className={styles.successNote}>{OTHER_APPROVER_HANDLED.policyNote}</p>

      <div className={styles.snapshotCard}>
        {OTHER_APPROVER_HANDLED.rows.map((row) => (
          <div key={row.label} className={styles.snapshotRow}>
            <span className={styles.snapshotLabel}>{row.label}</span>
            <span className={styles.snapshotValue}>{row.value}</span>
          </div>
        ))}
      </div>

      <div className={styles.decisionActionRow}>
        <span className={styles.disabledNote}>승인·반려 불가</span>
        <button type="button" className={styles.primaryButton} onClick={onClose}>
          확인
        </button>
      </div>
    </Modal>
  )
}
