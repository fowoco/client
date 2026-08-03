import { useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import styles from './overlays.module.css'

const EXPIRIES = ['24시간', '72시간', '7일', '업무 마감일까지']

export interface ReissueSubmission {
  reason: string
  expiry: string
}

export interface LinkReissueModalProps {
  open: boolean
  taskTitle: string
  onClose: () => void
  onSubmit: (submission: ReissueSubmission) => void
}

// Figma 08_Prototype Flow · Flow E(보안 링크 만료·재발급) 기준.
// 서버 워커 링크 재발급 API는 아직 main에 병합되지 않아 (feat/7-worker-link 브랜치,
// POST /api/v1/tasks/{taskId}/worker-link { rotateExisting: true }) 데모로만 동작한다.
export function LinkReissueModal({ open, taskTitle, onClose, onSubmit }: LinkReissueModalProps) {
  const [reason, setReason] = useState('기존 링크 만료')
  const [expiry, setExpiry] = useState(EXPIRIES[1])

  function handleSubmit() {
    onSubmit({ reason, expiry })
  }

  return (
    <Modal open={open} onClose={onClose} title="보안 링크 재발급" size="wide">
      <p className={styles.description}>새 링크를 만들면 기존 링크는 즉시 폐기됩니다.</p>

      <p className={styles.fieldLabel}>대상 업무</p>
      <div className={styles.fieldBox}>{taskTitle}</div>

      <p className={styles.fieldLabel}>재발급 사유</p>
      <input
        className={styles.textInput}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />

      <p className={`${styles.fieldLabel} ${styles.evidenceTypeLabel}`}>만료시간</p>
      <div className={styles.chipRow}>
        {EXPIRIES.map((option) => (
          <button
            key={option}
            type="button"
            className={`${styles.chip} ${expiry === option ? styles.chipSelected : ''}`}
            onClick={() => setExpiry(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onClose}>
          취소
        </button>
        <button type="button" className={styles.primaryButton} onClick={handleSubmit}>
          새 링크 생성
        </button>
      </div>
    </Modal>
  )
}
