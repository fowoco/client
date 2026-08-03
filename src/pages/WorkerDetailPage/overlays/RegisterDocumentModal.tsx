import { useState, type ChangeEvent } from 'react'
import { registerWorkerDocument, patchWorkerDocument, type DocumentType, type SubmissionStatus } from '../../../api/documents'
import { ApiError, getErrorMessage } from '../../../api/errors'
import { uploadFile } from '../../../api/files'
import { Button } from '../../../components/ui/Button/Button'
import { Modal } from '../../../components/ui/Modal/Modal'
import { DOCUMENT_TYPE_LABEL, SUBMISSION_STATUS_LABEL } from '../../../utils/documentLabels'
import styles from './overlays.module.css'

const DOCUMENT_TYPES: DocumentType[] = ['PASSPORT_COPY', 'ARC', 'CONTRACT', 'PERMIT']
const SUBMISSION_STATUSES: SubmissionStatus[] = ['MISSING', 'SUBMITTED', 'VERIFIED']

// fowoco/server FileService 기준 첨부 파일 제약 (image/jpeg·png·webp, application/pdf, 최대 20MB).
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

export interface RegisterDocumentModalProps {
  open: boolean
  workerId: string
  onClose: () => void
  onRegistered: () => void
}

export function RegisterDocumentModal({ open, workerId, onClose, onRegistered }: RegisterDocumentModalProps) {
  const [documentType, setDocumentType] = useState<DocumentType>('PASSPORT_COPY')
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('SUBMITTED')
  const [expiryDate, setExpiryDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function resetAndClose() {
    setDocumentType('PASSPORT_COPY')
    setSubmissionStatus('SUBMITTED')
    setExpiryDate('')
    setFile(null)
    setFileError(null)
    setErrorMessage(null)
    onClose()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0] ?? null
    if (!chosen) {
      setFile(null)
      setFileError(null)
      return
    }
    if (!ALLOWED_FILE_TYPES.includes(chosen.type)) {
      setFile(null)
      setFileError('지원하지 않는 파일 형식입니다 (JPEG·PNG·WEBP·PDF만 가능)')
      return
    }
    if (chosen.size > MAX_FILE_SIZE_BYTES) {
      setFile(null)
      setFileError('파일이 너무 큽니다 (최대 20MB)')
      return
    }
    setFile(chosen)
    setFileError(null)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setErrorMessage(null)
    try {
      const created = await registerWorkerDocument(workerId, {
        document_type: documentType,
        submission_status: submissionStatus,
        expiry_date: expiryDate || undefined,
      })

      if (file) {
        const uploaded = await uploadFile({ file, purpose: 'worker_document', workerId })
        await patchWorkerDocument(workerId, created.worker_document_id, {
          file_id: uploaded.file_id,
          expected_version: created.version,
        })
      }

      onRegistered()
      resetAndClose()
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? getErrorMessage(error) : '서류를 등록하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={resetAndClose} title="서류 등록">
      <p className={styles.fieldLabel}>서류 유형</p>
      <div className={styles.chipRow}>
        {DOCUMENT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={`${styles.chip} ${documentType === type ? styles.chipSelected : ''}`}
            onClick={() => setDocumentType(type)}
          >
            {DOCUMENT_TYPE_LABEL[type]}
          </button>
        ))}
      </div>

      <p className={`${styles.fieldLabel} ${styles.fieldLabelSpaced}`}>제출 상태</p>
      <div className={styles.chipRow}>
        {SUBMISSION_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={`${styles.chip} ${submissionStatus === status ? styles.chipSelected : ''}`}
            onClick={() => setSubmissionStatus(status)}
          >
            {SUBMISSION_STATUS_LABEL[status]}
          </button>
        ))}
      </div>

      <p className={`${styles.fieldLabel} ${styles.fieldLabelSpaced}`}>유효기간 (선택)</p>
      <input
        type="date"
        className={styles.textInput}
        value={expiryDate}
        onChange={(event) => setExpiryDate(event.target.value)}
      />

      <p className={`${styles.fieldLabel} ${styles.fieldLabelSpaced}`}>첨부 파일 (선택)</p>
      <input
        type="file"
        accept={ALLOWED_FILE_TYPES.join(',')}
        aria-label="서류 파일 선택"
        onChange={handleFileChange}
      />
      {fileError && <p className={styles.errorText}>{fileError}</p>}
      {file && !fileError && <p className={styles.fileSelected}>{file.name}</p>}

      {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={resetAndClose}>
          취소
        </button>
        <Button onClick={handleSubmit} disabled={submitting || !!fileError}>
          {submitting ? '등록 중...' : '등록'}
        </Button>
      </div>
    </Modal>
  )
}
