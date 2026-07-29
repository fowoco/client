import { Modal } from '../../../components/ui/Modal/Modal'
import type { ImportRow } from './importWizardData'
import styles from './importWizard.module.css'

export interface MissingDocumentRequestModalProps {
  open: boolean
  row: ImportRow | null
  onClose: () => void
  onSend: (rowId: string) => void
}

function buildDraft(row: ImportRow): string {
  const documentList = row.missingDocuments.join(', ')
  return `안녕하세요 ${row.workerName}님,\n\n등록 절차 진행을 위해 아래 서류가 추가로 필요합니다.\n\n필요 서류: ${documentList}\n\n보안 링크를 통해 제출해 주시면 확인 후 등록을 완료하겠습니다.\n감사합니다.`
}

export function MissingDocumentRequestModal({ open, row, onClose, onSend }: MissingDocumentRequestModalProps) {
  if (!row) return null

  return (
    <Modal open={open} onClose={onClose} title="누락 서류 요청 미리보기" size="wide">
      <p className={styles.description}>
        {row.workerName}님에게 보안 링크와 함께 발송할 안내문 초안입니다. 실제 발송 전 내용을 확인하세요.
      </p>

      <div className={styles.draftBox}>{buildDraft(row)}</div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onClose}>
          닫기
        </button>
        <button type="button" className={styles.primaryButton} onClick={() => onSend(row.id)}>
          안내 보내기
        </button>
      </div>
    </Modal>
  )
}
