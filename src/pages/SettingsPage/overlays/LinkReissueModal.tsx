import { useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import type { SecurityLinkHistoryEntry } from '../settingsData'
import styles from './overlays.module.css'

const CHANNELS = ['링크 복사', '문자용 안내문', '메신저용 안내문', '이메일 초안']
const EXPIRIES = ['24시간', '72시간', '7일', '업무 마감일까지']

export interface ReissueSubmission {
  reason: string
  channel: string
  expiry: string
}

export interface LinkReissueModalProps {
  open: boolean
  entry: SecurityLinkHistoryEntry | null
  onClose: () => void
  onSubmit: (submission: ReissueSubmission) => void
}

export function LinkReissueModal({ open, entry, onClose, onSubmit }: LinkReissueModalProps) {
  const [reason, setReason] = useState('기존 링크 만료')
  const [channel, setChannel] = useState(CHANNELS[0])
  const [expiry, setExpiry] = useState(EXPIRIES[1])

  function handleSubmit() {
    onSubmit({ reason, channel, expiry })
  }

  return (
    <Modal open={open} onClose={onClose} title="보안 링크 재발급" size="wide">
      <p className={styles.warningDescription}>새 링크를 만들면 기존 링크는 즉시 폐기됩니다.</p>

      <p className={styles.fieldLabel}>대상 근로자</p>
      <div className={styles.fieldBox}>{entry?.workerName} · E-9</div>

      <p className={`${styles.fieldLabel} ${styles.fieldLabelSpaced}`}>재발급 사유</p>
      <input className={styles.textInput} value={reason} onChange={(event) => setReason(event.target.value)} />

      <p className={`${styles.fieldLabel} ${styles.fieldLabelSpaced}`}>기존 링크 상태</p>
      <div className={styles.fieldBoxCritical}>
        {entry?.status} · {entry?.issuedAt}
      </div>

      <p className={`${styles.fieldLabel} ${styles.fieldLabelSpaced}`}>전달 채널</p>
      <div className={styles.channelGrid}>
        {CHANNELS.map((option) => (
          <button
            key={option}
            type="button"
            className={`${styles.channelOption} ${channel === option ? styles.channelOptionSelected : ''}`}
            onClick={() => setChannel(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <p className={`${styles.fieldLabel} ${styles.fieldLabelSpaced}`}>만료시간</p>
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
