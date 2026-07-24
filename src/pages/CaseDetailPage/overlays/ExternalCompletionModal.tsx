import { useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import styles from './overlays.module.css'

type EvidenceType = '접수번호' | '파일' | '화면 캡처'

const EVIDENCE_TYPES: EvidenceType[] = ['접수번호', '파일', '화면 캡처']

const EVIDENCE_PLACEHOLDER: Record<EvidenceType, string> = {
  접수번호: '접수번호를 입력하세요',
  파일: '첨부할 파일명을 입력하세요',
  '화면 캡처': '캡처 파일명을 입력하세요',
}

export interface ExternalCompletionModalProps {
  open: boolean
  onClose: () => void
  onComplete: (evidenceType: EvidenceType, evidenceValue: string, memo: string) => void
}

export function ExternalCompletionModal({ open, onClose, onComplete }: ExternalCompletionModalProps) {
  const [evidenceType, setEvidenceType] = useState<EvidenceType | null>(null)
  const [evidenceValue, setEvidenceValue] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [memo, setMemo] = useState('')

  const isReady = evidenceType !== null && evidenceValue.trim() !== '' && confirmed

  function handleComplete() {
    if (!isReady || evidenceType === null) return
    onComplete(evidenceType, evidenceValue, memo)
    setEvidenceType(null)
    setEvidenceValue('')
    setConfirmed(false)
    setMemo('')
  }

  return (
    <Modal open={open} onClose={onClose} title="외부기관 업무 완료" size="wide">
      <p className={styles.description}>
        {isReady ? '증빙과 담당자 확인이 완료되었습니다.' : '이 처리 절차는 완료 증빙 1개 이상이 필요합니다.'}
      </p>

      {isReady ? (
        <p className={styles.readyBanner}>✓ 완료 조건을 모두 충족했습니다.</p>
      ) : (
        <p className={styles.blockedBanner}>완료할 수 없습니다 · 증빙을 등록해 주세요.</p>
      )}

      <p className={`${styles.fieldLabel} ${styles.evidenceTypeLabel}`}>허용된 증빙 유형</p>
      <div className={styles.chipRow}>
        {EVIDENCE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={`${styles.chip} ${evidenceType === type ? styles.chipSelected : ''}`}
            onClick={() => setEvidenceType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {evidenceType && (
        <div className={styles.field}>
          <input
            className={styles.evidenceInput}
            value={evidenceValue}
            onChange={(event) => setEvidenceValue(event.target.value)}
            placeholder={EVIDENCE_PLACEHOLDER[evidenceType]}
          />
        </div>
      )}

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        <span>실제 제출은 담당자가 직접 수행했습니다.</span>
      </label>

      {!isReady && (
        <p className={styles.blockedNote}>증빙과 담당자 확인을 완료해야 버튼이 활성화됩니다.</p>
      )}

      {isReady && (
        <textarea
          className={styles.memoTextarea}
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="완료 메모 · 선택사항"
        />
      )}

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onClose}>
          취소
        </button>
        <button type="button" className={styles.primaryButton} onClick={handleComplete} disabled={!isReady}>
          완료 처리
        </button>
      </div>
    </Modal>
  )
}
