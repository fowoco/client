import { useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import styles from './overlays.module.css'

export interface InternalCompletionModalProps {
  open: boolean
  onClose: () => void
  onComplete: (memo: string) => void
}

export function InternalCompletionModal({ open, onClose, onComplete }: InternalCompletionModalProps) {
  const [memo, setMemo] = useState('')

  function handleComplete() {
    onComplete(memo)
    setMemo('')
  }

  return (
    <Modal open={open} onClose={onClose} title="일반 내부업무 완료">
      <p className={styles.description}>
        필수 체크리스트가 완료되어 파일 첨부 없이 완료할 수 있습니다.
      </p>

      <p className={styles.readyBanner}>✓ 필수 체크리스트 4 / 4 완료</p>

      <div className={styles.plainRow}>
        <span className={styles.plainLabel}>증빙 요구</span>
        <span className={styles.plainValueSuccess}>증빙 불필요</span>
      </div>
      <div className={styles.plainRow}>
        <span className={styles.plainLabel}>완료 처리자</span>
        <span className={styles.plainValue}>김민지 · 자동 기록</span>
      </div>
      <div className={styles.plainRow}>
        <span className={styles.plainLabel}>완료 일시</span>
        <span className={styles.plainValue}>완료 시점 자동 기록</span>
      </div>

      <textarea
        className={styles.memoTextarea}
        value={memo}
        onChange={(event) => setMemo(event.target.value)}
        placeholder="완료 메모 · 선택사항"
      />

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onClose}>
          취소
        </button>
        <button type="button" className={styles.primaryButton} onClick={handleComplete}>
          파일 없이 완료
        </button>
      </div>
    </Modal>
  )
}
