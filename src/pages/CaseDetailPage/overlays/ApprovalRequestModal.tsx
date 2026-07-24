import { Modal } from '../../../components/ui/Modal/Modal'
import { APPROVAL_REQUEST_FORM } from '../caseDetailData'
import styles from './overlays.module.css'

export interface ApprovalRequestModalProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
}

export function ApprovalRequestModal({ open, onClose, onSubmit }: ApprovalRequestModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="승인 요청" size="wide">
      <p className={styles.description}>
        안내문과 핵심 내용을 지정 승인자 또는 승인자 그룹에 요청합니다.
      </p>

      <div className={styles.field}>
        <p className={styles.fieldLabel}>승인 대상</p>
        <div className={styles.fieldBox}>{APPROVAL_REQUEST_FORM.target}</div>
      </div>

      <div className={styles.field}>
        <p className={styles.fieldLabel}>승인자</p>
        <div className={styles.fieldBox}>{APPROVAL_REQUEST_FORM.approverGroup}</div>
      </div>

      <div className={styles.ruleCard}>
        <p className={styles.ruleTitle}>{APPROVAL_REQUEST_FORM.anyOneRuleTitle}</p>
        <p className={styles.ruleBody}>{APPROVAL_REQUEST_FORM.anyOneRuleBody}</p>
      </div>

      <div className={styles.field}>
        <p className={styles.fieldLabel}>요청 메모</p>
        <div className={styles.fieldBox}>{APPROVAL_REQUEST_FORM.memo}</div>
      </div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onClose}>
          취소
        </button>
        <button type="button" className={styles.primaryButton} onClick={onSubmit}>
          승인 요청 보내기
        </button>
      </div>

      <p className={styles.footnote}>{APPROVAL_REQUEST_FORM.footnote}</p>
    </Modal>
  )
}
