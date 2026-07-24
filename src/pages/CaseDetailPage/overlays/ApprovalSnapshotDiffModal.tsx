import { Modal } from '../../../components/ui/Modal/Modal'
import { APPROVAL_SNAPSHOT_DIFF } from '../caseDetailData'
import styles from './overlays.module.css'

export interface ApprovalSnapshotDiffModalProps {
  open: boolean
  onClose: () => void
  onRequestReapproval: () => void
}

export function ApprovalSnapshotDiffModal({
  open,
  onClose,
  onRequestReapproval,
}: ApprovalSnapshotDiffModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="승인본 V1 · 수정본 V2 변경 내용" size="xl">
      <p className={styles.warningNote}>{APPROVAL_SNAPSHOT_DIFF.warningNote}</p>

      <div className={styles.diffTable}>
        <div className={styles.diffHeaderRow}>
          <span>변경 필드</span>
          <span>승인본 V1</span>
          <span>수정본 V2</span>
          <span>결과</span>
        </div>
        {APPROVAL_SNAPSHOT_DIFF.rows.map((row, index) => (
          <div
            key={row.field}
            className={`${styles.diffRow} ${index % 2 === 0 ? styles.diffRowShaded : ''}`}
          >
            <span className={styles.diffField}>{row.field}</span>
            <span className={styles.diffValue}>{row.before}</span>
            <span className={styles.diffValue}>{row.after}</span>
            <span className={row.result === '재승인' ? styles.diffResultWarning : styles.diffResultNeutral}>
              {row.result}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onClose}>
          닫기
        </button>
        <button type="button" className={styles.primaryButton} onClick={onRequestReapproval}>
          재승인 요청
        </button>
      </div>
    </Modal>
  )
}
