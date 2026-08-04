import { Modal } from '../../../components/ui/Modal/Modal'
import styles from './overlays.module.css'

export interface ApprovalDecisionModalProps {
  open: boolean
  taskTitle: string
  dueDate: string | null
  workflowId: string
  submitting?: boolean
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}

export function ApprovalDecisionModal({
  open,
  taskTitle,
  dueDate,
  workflowId,
  submitting = false,
  onClose,
  onApprove,
  onReject,
}: ApprovalDecisionModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="승인 요청을 검토하세요" size="wide">
      <p className={styles.description}>서버에 저장된 현재 Task 버전을 검토합니다.</p>

      <div className={styles.snapshotCard}>
        <p className={styles.snapshotTitle}>현재 승인 대상</p>
        <div className={styles.snapshotRow}>
          <span className={styles.snapshotLabel}>업무</span>
          <span className={styles.snapshotValue}>{taskTitle}</span>
        </div>
        <div className={styles.snapshotRow}>
          <span className={styles.snapshotLabel}>마감일</span>
          <span className={styles.snapshotValue}>{dueDate ?? '미지정'}</span>
        </div>
        <div className={styles.snapshotRow}>
          <span className={styles.snapshotLabel}>Workflow</span>
          <span className={styles.snapshotValue}>{workflowId}</span>
        </div>
      </div>

      <div className={styles.policyBanner}>
        <p className={styles.policyBannerText}>승인·반려 결과는 서버 활동이력에 기록됩니다.</p>
      </div>

      <div className={styles.decisionActionRow}>
        <button type="button" className={styles.rejectButton} onClick={onReject} disabled={submitting}>
          반려
        </button>
        <button type="button" className={styles.primaryButton} onClick={onApprove} disabled={submitting}>
          {submitting ? '처리 중…' : '승인'}
        </button>
      </div>
    </Modal>
  )
}
