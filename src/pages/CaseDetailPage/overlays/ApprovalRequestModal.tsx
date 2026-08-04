import { Modal } from '../../../components/ui/Modal/Modal'
import styles from './overlays.module.css'

export interface ApprovalRequestModalProps {
  open: boolean
  taskTitle: string
  dueDate: string | null
  submitting?: boolean
  onClose: () => void
  onSubmit: () => void
}

export function ApprovalRequestModal({
  open,
  taskTitle,
  dueDate,
  submitting = false,
  onClose,
  onSubmit,
}: ApprovalRequestModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="승인 요청" size="wide">
      <p className={styles.description}>
        현재 Task의 제목·마감일·업무 데이터와 버전을 승인본으로 고정합니다.
      </p>

      <div className={styles.field}>
        <p className={styles.fieldLabel}>승인 대상</p>
        <div className={styles.fieldBox}>{taskTitle}</div>
      </div>

      <div className={styles.field}>
        <p className={styles.fieldLabel}>업무 마감일</p>
        <div className={styles.fieldBox}>{dueDate ?? '미지정'}</div>
      </div>

      <div className={styles.ruleCard}>
        <p className={styles.ruleTitle}>현재 버전만 승인됩니다.</p>
        <p className={styles.ruleBody}>승인 후 핵심 내용이 바뀌면 기존 승인은 무효화되고 다시 검토해야 합니다.</p>
      </div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onClose}>
          취소
        </button>
        <button type="button" className={styles.primaryButton} onClick={onSubmit} disabled={submitting}>
          {submitting ? '요청 중…' : '승인 요청 보내기'}
        </button>
      </div>

      <p className={styles.footnote}>외부 발송이 아니라 FOWOCO 내부 승인 요청입니다.</p>
    </Modal>
  )
}
