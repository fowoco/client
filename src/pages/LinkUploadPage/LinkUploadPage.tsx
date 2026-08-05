import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../api/errors'
import {
  fetchWorkerLink,
  submitWorkerResponse,
  uploadWorkerLinkDocument,
  type WorkerResponseSubmitResponse,
  type WorkerResponseType,
} from '../../api/workerLinks'
import { MobileShell } from '../../components/mobile/MobileShell'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { useApiQuery } from '../../hooks/useApiQuery'
import styles from './LinkUploadPage.module.css'
import { HELP_LINKS } from './linkUploadData'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function LinkUploadPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submission, setSubmission] = useState<WorkerResponseSubmitResponse | null>(null)
  const [responseMessage, setResponseMessage] = useState<string | null>(null)
  const fetcher = useCallback(
    () => (token ? fetchWorkerLink(token) : Promise.reject(new Error('missing token'))),
    [token],
  )
  const { status, data, error, refetch } = useApiQuery(fetcher)

  useEffect(() => {
    if (token && status === 'error' && error?.status === 410) {
      navigate(`/worker-portal/${encodeURIComponent(token)}/expired`, { replace: true })
    }
  }, [error, navigate, status, token])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    setFileError(null)
    if (!selected) return
    if (!ACCEPTED_FILE_TYPES.includes(selected.type)) {
      setFile(null)
      setFileError('JPG, PNG, PDF 파일만 선택할 수 있습니다.')
      event.target.value = ''
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null)
      setFileError('파일 크기는 10MB 이하여야 합니다.')
      event.target.value = ''
      return
    }
    setFile(selected)
  }

  function handleRemoveFile() {
    setFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit() {
    if (!token || !file || submitting) return
    setSubmitting(true)
    setFileError(null)
    const uploadRequestId = crypto.randomUUID()
    try {
      const upload = await uploadWorkerLinkDocument(token, file, uploadRequestId)
      const result = await submitWorkerResponse(token, {
        response_type: 'DOCUMENT_SUBMITTED',
        upload_ids: [upload.upload_id],
        idempotency_key: crypto.randomUUID(),
      })
      setSubmission(result)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 410) {
        navigate(`/worker-portal/${encodeURIComponent(token)}/expired`, { replace: true })
        return
      }
      setFileError(caught instanceof ApiError ? getErrorMessage(caught) : '파일을 제출하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleHelpResponse(responseType: WorkerResponseType, successMessage: string) {
    if (!token || submitting) return
    setSubmitting(true)
    setFileError(null)
    try {
      await submitWorkerResponse(token, {
        response_type: responseType,
        idempotency_key: crypto.randomUUID(),
      })
      setResponseMessage(successMessage)
    } catch (caught) {
      setFileError(caught instanceof ApiError ? getErrorMessage(caught) : '응답을 보내지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <MobileShell title="서류 제출" onBack={() => navigate(-1)}>
        <EmptyState kind="error" title="제출 링크가 필요합니다" body="회사 담당자가 전달한 전체 링크를 다시 열어 주세요." />
      </MobileShell>
    )
  }

  if (status === 'loading') {
    return (
      <MobileShell title="서류 제출" onBack={() => navigate(-1)}>
        <EmptyState kind="loading" title="제출 링크를 확인하고 있습니다" body="잠시만 기다려 주세요." />
      </MobileShell>
    )
  }

  if (status === 'error' || !data) {
    return (
      <MobileShell title="서류 제출" onBack={() => navigate(-1)}>
        <EmptyState
          kind="error"
          title="제출 링크를 확인하지 못했습니다"
          body={error instanceof ApiError ? getErrorMessage(error) : '네트워크 상태를 확인해 주세요.'}
          actionLabel="다시 시도"
          onAction={refetch}
        />
      </MobileShell>
    )
  }

  if (submission) {
    return (
      <MobileShell title="제출 완료" right={<span>완료</span>}>
        <div className={styles.successCard}>
          <span className={styles.successIcon}>✓</span>
          <h1 className={styles.successTitle}>서류를 제출했습니다</h1>
          <p className={styles.successBody}>담당자가 파일을 확인하면 다음 상태로 진행됩니다.</p>
          <p className={styles.successMeta}>접수 ID · {submission.response_id}</p>
        </div>
      </MobileShell>
    )
  }

  const canSubmitDocument = data.allowed_responses.includes('DOCUMENT_SUBMITTED')
  const helpResponses: Array<{ label: string; type: WorkerResponseType; message: string }> = [
    { label: HELP_LINKS[0], type: 'QUESTION', message: '담당자에게 질문 의사를 전했습니다.' },
    { label: HELP_LINKS[1], type: 'NOT_UNDERSTOOD', message: '담당자에게 추가 설명을 요청했습니다.' },
    { label: HELP_LINKS[2], type: 'DIFFICULT', message: '담당자에게 처리 어려움 상태를 전했습니다.' },
  ]

  return (
    <MobileShell title="요청 서류 제출" onBack={() => navigate(-1)} right={<span>보안 링크</span>}>
      <h1 className={styles.headline}>
        사진 또는 파일을
        <br />
        추가해 주세요
      </h1>
      <p className={styles.subtext}>여권 사진면 전체가 보이고 글자가 흐리지 않은지 확인해 주세요.</p>

      <button
        type="button"
        className={styles.dropzone}
        aria-label="파일 또는 사진 선택"
        onClick={() => fileInputRef.current?.click()}
      >
        <p className={styles.dropzonePlus}>＋</p>
        <p className={styles.dropzoneLabel}>파일 또는 사진 선택</p>
        <p className={styles.dropzoneHint}>JPG, PNG, PDF · 최대 10MB</p>
      </button>
      <input
        ref={fileInputRef}
        className={styles.fileInput}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
        aria-label="제출할 파일 선택"
        onChange={handleFileChange}
      />

      {fileError && <p className={styles.fileError} role="alert">{fileError}</p>}
      {responseMessage && <p className={styles.responseNotice}>{responseMessage}</p>}

      {file && (
        <div className={styles.selectedFile}>
          <div>
            <p className={styles.fileName}>{file.name}</p>
            <p className={styles.fileMeta}>
              {formatFileSize(file.size)} · 제출 전
            </p>
          </div>
          <button type="button" className={styles.removeFile} onClick={handleRemoveFile}>
            삭제
          </button>
        </div>
      )}

      <p className={styles.helpLabel}>제출이 어렵다면</p>
      <div className={styles.helpLinks}>
        {helpResponses.map((response, index) => (
          <button
            key={response.type}
            type="button"
            className={`${styles.helpLink} ${index === 0 ? styles.helpLinkPrimary : ''}`}
            disabled={!data.allowed_responses.includes(response.type) || submitting}
            onClick={() => handleHelpResponse(response.type, response.message)}
          >
            <span>{response.label}</span>
            <span>→</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className={styles.submit}
        disabled={!file || !canSubmitDocument || submitting}
        onClick={handleSubmit}
      >
        {submitting ? '제출 중…' : '서류 제출'}
      </button>

      <p className={styles.footnote}>
        업로드가 끝난 뒤 제출 응답까지 접수되어야 담당자 화면에 반영됩니다.
      </p>
    </MobileShell>
  )
}
