import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { DocumentType } from '../../api/documents'
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
import { DOCUMENT_TYPE_LABEL } from '../../utils/documentLabels'
import styles from './LinkUploadPage.module.css'
import { HELP_LINKS } from './linkUploadData'

const MAX_FILE_SIZE = 20 * 1024 * 1024
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function LinkUploadPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const fileInputRefs = useRef<Partial<Record<DocumentType, HTMLInputElement>>>({})
  const uploadRequestIds = useRef<Partial<Record<DocumentType, string>>>({})
  const responseRequestId = useRef<string | null>(null)
  const [files, setFiles] = useState<Partial<Record<DocumentType, File>>>({})
  const [fileErrors, setFileErrors] = useState<Partial<Record<DocumentType, string>>>({})
  const [uploadedIds, setUploadedIds] = useState<Partial<Record<DocumentType, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submission, setSubmission] = useState<WorkerResponseSubmitResponse | null>(null)
  const [responseMessage, setResponseMessage] = useState<string | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
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

  function handleFileChange(documentType: DocumentType, event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    setFileErrors((current) => ({ ...current, [documentType]: undefined }))
    setSubmissionError(null)
    if (!selected) return
    if (!ACCEPTED_FILE_TYPES.includes(selected.type)) {
      setFiles((current) => ({ ...current, [documentType]: undefined }))
      setFileErrors((current) => ({
        ...current,
        [documentType]: 'JPG, PNG, WEBP, PDF 파일만 선택할 수 있습니다.',
      }))
      event.target.value = ''
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFiles((current) => ({ ...current, [documentType]: undefined }))
      setFileErrors((current) => ({
        ...current,
        [documentType]: '파일 크기는 20MB 이하여야 합니다.',
      }))
      event.target.value = ''
      return
    }
    setFiles((current) => ({ ...current, [documentType]: selected }))
    setUploadedIds((current) => ({ ...current, [documentType]: undefined }))
    delete uploadRequestIds.current[documentType]
    responseRequestId.current = null
  }

  function handleRemoveFile(documentType: DocumentType) {
    setFiles((current) => ({ ...current, [documentType]: undefined }))
    setFileErrors((current) => ({ ...current, [documentType]: undefined }))
    setUploadedIds((current) => ({ ...current, [documentType]: undefined }))
    delete uploadRequestIds.current[documentType]
    responseRequestId.current = null
    const input = fileInputRefs.current[documentType]
    if (input) input.value = ''
  }

  async function handleSubmit() {
    if (!token || !data || submitting) return
    const requestedTypes = [...new Set(data.requested_document_types)]
    if (requestedTypes.length === 0 || requestedTypes.some((type) => !files[type])) {
      setSubmissionError('요청받은 서류의 파일을 모두 선택해 주세요.')
      return
    }
    setSubmitting(true)
    setSubmissionError(null)
    try {
      const nextUploadedIds = { ...uploadedIds }
      for (const documentType of requestedTypes) {
        if (nextUploadedIds[documentType]) continue
        const file = files[documentType]
        if (!file) throw new Error('missing selected file')
        const requestId = uploadRequestIds.current[documentType] ?? crypto.randomUUID()
        uploadRequestIds.current[documentType] = requestId
        const upload = await uploadWorkerLinkDocument(
          token,
          file,
          requestId,
          documentType,
        )
        nextUploadedIds[documentType] = upload.upload_id
        setUploadedIds({ ...nextUploadedIds })
      }
      const idempotencyKey = responseRequestId.current ?? crypto.randomUUID()
      responseRequestId.current = idempotencyKey
      const result = await submitWorkerResponse(token, {
        response_type: 'DOCUMENT_SUBMITTED',
        upload_ids: requestedTypes.map((type) => nextUploadedIds[type]!),
        idempotency_key: idempotencyKey,
      })
      setSubmission(result)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 410) {
        navigate(`/worker-portal/${encodeURIComponent(token)}/expired`, { replace: true })
        return
      }
      setSubmissionError(
        caught instanceof ApiError ? getErrorMessage(caught) : '파일을 제출하지 못했습니다.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleHelpResponse(responseType: WorkerResponseType, successMessage: string) {
    if (!token || submitting) return
    setSubmitting(true)
    setSubmissionError(null)
    try {
      await submitWorkerResponse(token, {
        response_type: responseType,
        idempotency_key: crypto.randomUUID(),
      })
      setResponseMessage(successMessage)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 410) {
        navigate(`/worker-portal/${encodeURIComponent(token)}/expired`, { replace: true })
        return
      }
      setSubmissionError(
        caught instanceof ApiError ? getErrorMessage(caught) : '응답을 보내지 못했습니다.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <MobileShell title="서류 제출" onBack={() => navigate(-1)}>
        <EmptyState
          kind="error"
          title="제출 링크가 필요합니다"
          body="회사 담당자가 전달한 전체 링크를 다시 열어 주세요."
        />
      </MobileShell>
    )
  }

  if (status === 'loading') {
    return (
      <MobileShell title="서류 제출" onBack={() => navigate(-1)}>
        <EmptyState
          kind="loading"
          title="제출 링크를 확인하고 있습니다"
          body="잠시만 기다려 주세요."
        />
      </MobileShell>
    )
  }

  if (status === 'error' || !data) {
    const contentNotReady =
      error instanceof ApiError && error.code === 'WORKER_LINK_CONTENT_NOT_READY'
    return (
      <MobileShell title="서류 제출" onBack={() => navigate(-1)}>
        <EmptyState
          kind="error"
          title={contentNotReady ? '요청 내용을 준비하고 있습니다' : '제출 링크를 확인하지 못했습니다'}
          body={
            contentNotReady
              ? '회사 담당자가 안내문을 준비 중입니다. 잠시 후 같은 링크에서 다시 확인해 주세요.'
              : error instanceof ApiError
                ? getErrorMessage(error)
                : '네트워크 상태를 확인해 주세요.'
          }
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
  const requestedTypes = [...new Set(data.requested_document_types)]
  const selectedCount = requestedTypes.filter((type) => files[type]).length
  const allRequestedFilesSelected =
    requestedTypes.length > 0 && selectedCount === requestedTypes.length
  const helpResponses: Array<{ label: string; type: WorkerResponseType; message: string }> = [
    { label: HELP_LINKS[0], type: 'QUESTION', message: '담당자에게 질문 의사를 전했습니다.' },
    {
      label: HELP_LINKS[1],
      type: 'NOT_UNDERSTOOD',
      message: '담당자에게 추가 설명을 요청했습니다.',
    },
    {
      label: HELP_LINKS[2],
      type: 'DIFFICULT',
      message: '담당자에게 처리 어려움 상태를 전했습니다.',
    },
  ]

  return (
    <MobileShell
      title="요청 서류 제출"
      onBack={() => navigate(-1)}
      right={<span>{selectedCount} / {requestedTypes.length}</span>}
    >
      <h1 className={styles.headline}>
        요청받은 서류를
        <br />
        추가해 주세요
      </h1>
      <p className={styles.subtext}>
        각 서류의 글자와 사진이 선명하게 보이는지 확인해 주세요.
      </p>

      <div className={styles.requestList}>
        {requestedTypes.map((documentType) => {
          const file = files[documentType]
          const documentLabel = DOCUMENT_TYPE_LABEL[documentType]
          return (
            <section key={documentType} className={styles.requestCard}>
              <div className={styles.requestCardHeader}>
                <h2 className={styles.requestTitle}>{documentLabel}</h2>
                <span>{file ? '선택 완료' : '파일 필요'}</span>
              </div>
              <button
                type="button"
                className={styles.dropzone}
                aria-label={`${documentLabel} 파일 또는 사진 선택`}
                disabled={submitting}
                onClick={() => fileInputRefs.current[documentType]?.click()}
              >
                <p className={styles.dropzonePlus}>{file ? '↻' : '＋'}</p>
                <p className={styles.dropzoneLabel}>{file ? '다른 파일 선택' : '파일 또는 사진 선택'}</p>
                <p className={styles.dropzoneHint}>JPG, PNG, WEBP, PDF · 최대 20MB</p>
              </button>
              <input
                ref={(element) => {
                  if (element) fileInputRefs.current[documentType] = element
                }}
                className={styles.fileInput}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                aria-label={`${documentLabel} 제출할 파일 선택`}
                disabled={submitting}
                onChange={(event) => handleFileChange(documentType, event)}
              />

              {fileErrors[documentType] && (
                <p className={styles.fileError} role="alert">
                  {fileErrors[documentType]}
                </p>
              )}

              {file && (
                <div className={styles.selectedFile}>
                  <div>
                    <p className={styles.fileName}>{file.name}</p>
                    <p className={styles.fileMeta}>{formatFileSize(file.size)} · 제출 전 확인</p>
                  </div>
                  <button
                    type="button"
                    className={styles.removeFile}
                    disabled={submitting}
                    onClick={() => handleRemoveFile(documentType)}
                  >
                    제거
                  </button>
                </div>
              )}
            </section>
          )
        })}
      </div>

      {submissionError && (
        <p className={styles.fileError} role="alert">
          {submissionError}
        </p>
      )}
      {responseMessage && <p className={styles.responseNotice}>{responseMessage}</p>}

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
        disabled={!allRequestedFilesSelected || !canSubmitDocument || submitting}
        onClick={handleSubmit}
      >
        {submitting ? '제출 중…' : '서류 제출'}
      </button>

      <p className={styles.footnote}>제출한 파일은 회사 인사팀 담당자가 확인합니다.</p>
    </MobileShell>
  )
}
