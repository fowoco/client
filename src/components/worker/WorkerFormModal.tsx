import { useEffect, useState } from 'react'
import { registerWorker, patchWorker, type WorkerResponse, type WorkStatus } from '../../api/workers'
import { ApiError, getErrorMessage } from '../../api/errors'
import { Button } from '../ui/Button/Button'
import { Modal } from '../ui/Modal/Modal'
import styles from './WorkerFormModal.module.css'

const NATIONALITY_OPTIONS: { code: string; label: string; language: string }[] = [
  { code: 'VN', label: '베트남', language: 'vi' },
  { code: 'ID', label: '인도네시아', language: 'id' },
  { code: 'KH', label: '캄보디아', language: 'km' },
  { code: 'NP', label: '네팔', language: 'ne' },
  { code: 'MM', label: '미얀마', language: 'my' },
  { code: 'PH', label: '필리핀', language: 'tl' },
  { code: 'TH', label: '태국', language: 'th' },
]

const WORK_STATUS_OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: 'ACTIVE', label: '재직' },
  { value: 'ON_LEAVE', label: '휴직' },
  { value: 'RESIGNED', label: '퇴사' },
  { value: 'TERMINATED', label: '계약종료' },
]

export interface WorkerFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  worker?: WorkerResponse
  onClose: () => void
  onSaved: (worker: WorkerResponse) => void
}

function errorMessageOf(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.fieldErrors.length > 0) return error.fieldErrors.map((item) => item.message).join(' ')
    return getErrorMessage(error)
  }
  return fallback
}

export function WorkerFormModal({ open, mode, worker, onClose, onSaved }: WorkerFormModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [nationalityCode, setNationalityCode] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('')
  const [workStatus, setWorkStatus] = useState<WorkStatus>('ACTIVE')
  const [stayExpiryDate, setStayExpiryDate] = useState('')
  const [contractStartDate, setContractStartDate] = useState('')
  const [contractEndDate, setContractEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDisplayName(worker?.display_name ?? '')
    setNationalityCode(worker?.nationality_code ?? '')
    setPreferredLanguage(worker?.preferred_language ?? '')
    setWorkStatus(worker?.work_status ?? 'ACTIVE')
    setStayExpiryDate(worker?.stay_expiry_date ?? '')
    setContractStartDate(worker?.contract_start_date ?? '')
    setContractEndDate(worker?.contract_end_date ?? '')
    setErrorMessage(null)
  }, [open, worker])

  function handleSelectNationality(option: (typeof NATIONALITY_OPTIONS)[number]) {
    setNationalityCode(option.code)
    if (!preferredLanguage) setPreferredLanguage(option.language)
  }

  async function handleSubmit() {
    if (!displayName.trim()) {
      setErrorMessage('표시 이름을 입력해 주세요.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)
    try {
      const saved =
        mode === 'create'
          ? await registerWorker({
              display_name: displayName.trim(),
              nationality_code: nationalityCode || undefined,
              preferred_language: preferredLanguage || undefined,
              stay_expiry_date: stayExpiryDate || undefined,
              contract_start_date: contractStartDate || undefined,
              contract_end_date: contractEndDate || undefined,
            })
          : await patchWorker(worker!.worker_id, {
              display_name: displayName.trim(),
              nationality_code: nationalityCode || undefined,
              preferred_language: preferredLanguage || undefined,
              work_status: workStatus,
              stay_expiry_date: stayExpiryDate || undefined,
              contract_start_date: contractStartDate || undefined,
              contract_end_date: contractEndDate || undefined,
              expected_version: worker!.version,
            })
      onSaved(saved)
      onClose()
    } catch (error) {
      setErrorMessage(
        errorMessageOf(error, mode === 'create' ? '근로자를 등록하지 못했습니다.' : '근로자 정보를 수정하지 못했습니다.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === 'create' ? '근로자 등록' : '근로자 정보 수정'}>
      <p className={styles.fieldLabel}>표시 이름</p>
      <input
        type="text"
        className={styles.textInput}
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        placeholder="응웬반A"
      />

      <p className={`${styles.fieldLabel} ${styles.fieldLabelSpaced}`}>국적</p>
      <div className={styles.chipRow}>
        {NATIONALITY_OPTIONS.map((option) => (
          <button
            key={option.code}
            type="button"
            className={`${styles.chip} ${nationalityCode === option.code ? styles.chipSelected : ''}`}
            onClick={() => handleSelectNationality(option)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className={`${styles.fieldLabel} ${styles.fieldLabelSpaced}`}>선호 언어</p>
      <input
        type="text"
        className={styles.textInput}
        value={preferredLanguage}
        onChange={(event) => setPreferredLanguage(event.target.value)}
        placeholder="vi"
      />

      {mode === 'edit' && (
        <>
          <p className={`${styles.fieldLabel} ${styles.fieldLabelSpaced}`}>근무 상태</p>
          <div className={styles.chipRow}>
            {WORK_STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.chip} ${workStatus === option.value ? styles.chipSelected : ''}`}
                onClick={() => setWorkStatus(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}

      <p className={`${styles.fieldLabel} ${styles.fieldLabelSpaced}`}>체류 만료일</p>
      <input
        type="date"
        className={styles.textInput}
        value={stayExpiryDate}
        onChange={(event) => setStayExpiryDate(event.target.value)}
      />

      <p className={`${styles.fieldLabel} ${styles.fieldLabelSpaced}`}>계약 기간</p>
      <div className={styles.dateRow}>
        <input
          type="date"
          className={styles.textInput}
          aria-label="계약 시작일"
          value={contractStartDate}
          onChange={(event) => setContractStartDate(event.target.value)}
        />
        <input
          type="date"
          className={styles.textInput}
          aria-label="계약 종료일"
          value={contractEndDate}
          onChange={(event) => setContractEndDate(event.target.value)}
        />
      </div>

      {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={onClose}>
          취소
        </button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? '저장 중...' : mode === 'create' ? '등록' : '저장'}
        </Button>
      </div>
    </Modal>
  )
}
