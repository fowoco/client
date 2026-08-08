import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createDocumentOcrRun,
  fetchDocumentOcrRun,
  fetchLatestDocumentOcrRun,
  reviewDocumentOcrRun,
  type DocumentOcrRunResponse,
  type DocumentOcrStatus,
} from '../../api/documentOcr'
import type { DocumentType } from '../../api/documents'
import { ApiError, getErrorMessage } from '../../api/errors'
import { Button } from '../../components/ui/Button/Button'
import { StatusLabel, type StatusTone } from '../../components/ui/StatusLabel/StatusLabel'
import styles from './DocumentOcrPanel.module.css'

const POLL_INTERVAL_MS = 1500
const PROCESSING_STATUSES: DocumentOcrStatus[] = ['QUEUED', 'RUNNING']
const REVIEWABLE_STATUSES: DocumentOcrStatus[] = ['READY_FOR_REVIEW', 'REVIEW_REQUIRED']

const STATUS_PRESENTATION: Record<DocumentOcrStatus, { label: string; tone: StatusTone }> = {
  QUEUED: { label: '실행 대기', tone: 'info' },
  RUNNING: { label: '추출 중', tone: 'info' },
  READY_FOR_REVIEW: { label: '검토 가능', tone: 'success' },
  REVIEW_REQUIRED: { label: '확인 필요', tone: 'warning' },
  APPROVED: { label: '검토 완료', tone: 'success' },
  REJECTED: { label: '반려', tone: 'critical' },
  FAILED: { label: '실행 실패', tone: 'critical' },
}

const FIELD_LABEL: Record<string, string> = {
  passport_number: '여권번호',
  surname: '성',
  given_names: '이름',
  date_of_birth: '생년월일',
  sex: '성별',
  passport_issue_date: '여권 발급일',
  passport_expiry_date: '여권 만료일',
  alien_registration_number: '외국인등록번호',
  visa_type: '체류 자격',
  stay_expiration_date: '체류 만료일',
  residence_address_1: '체류지 주소',
}

const CORRECTABLE_FIELDS: Record<'PASSPORT_COPY' | 'ARC', Set<string>> = {
  PASSPORT_COPY: new Set([
    'passport_number',
    'surname',
    'given_names',
    'date_of_birth',
    'sex',
    'passport_issue_date',
    'passport_expiry_date',
  ]),
  ARC: new Set([
    'alien_registration_number',
    'visa_type',
    'stay_expiration_date',
    'residence_address_1',
  ]),
}

type PanelState = 'loading' | 'empty' | 'ready' | 'disabled' | 'error'

interface DocumentOcrPanelProps {
  documentId: string
  documentType: DocumentType
  fileId: string | null
}

function messageFor(error: unknown) {
  return error instanceof ApiError
    ? getErrorMessage(error)
    : 'OCR 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

export function DocumentOcrPanel({ documentId, documentType, fileId }: DocumentOcrPanelProps) {
  const supported = documentType === 'PASSPORT_COPY' || documentType === 'ARC'
  const [panelState, setPanelState] = useState<PanelState>('loading')
  const [run, setRun] = useState<DocumentOcrRunResponse | null>(null)
  const [fieldDrafts, setFieldDrafts] = useState<Record<string, string>>({})
  const [rejectReason, setRejectReason] = useState('')
  const [requestError, setRequestError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<'create' | 'approve' | 'reject' | null>(null)
  const requestKeyRef = useRef<string | null>(null)

  const applyRun = useCallback((next: DocumentOcrRunResponse) => {
    setRun(next)
    setPanelState('ready')
    setRequestError(null)
    if (next.result) {
      setFieldDrafts({ ...next.result.fields, ...next.corrected_fields })
    }
  }, [])

  const loadLatest = useCallback(async () => {
    if (!supported || !fileId) return
    setPanelState('loading')
    setRequestError(null)
    try {
      applyRun(await fetchLatestDocumentOcrRun(documentId))
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setPanelState('empty')
        setRun(null)
      } else if (error instanceof ApiError && error.status === 503) {
        setPanelState('disabled')
        setRun(null)
      } else {
        setPanelState('error')
        setRequestError(messageFor(error))
      }
    }
  }, [applyRun, documentId, fileId, supported])

  useEffect(() => {
    if (!supported || !fileId) return
    void loadLatest()
  }, [fileId, loadLatest, supported])

  useEffect(() => {
    if (!run || !PROCESSING_STATUSES.includes(run.status)) return

    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const next = await fetchDocumentOcrRun(documentId, run.ocr_run_id)
        if (!cancelled) applyRun(next)
      } catch (error) {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 503) {
          setPanelState('disabled')
        } else {
          setPanelState('error')
          setRequestError(messageFor(error))
        }
      }
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [applyRun, documentId, run])

  const changedFields = useMemo(() => {
    if (!run?.result || (documentType !== 'PASSPORT_COPY' && documentType !== 'ARC')) return {}
    const allowed = CORRECTABLE_FIELDS[documentType]
    return Object.fromEntries(
      Object.entries(fieldDrafts)
        .filter(
          ([field, value]) => allowed.has(field) && value.trim() !== run.result?.fields[field],
        )
        .map(([field, value]) => [field, value.trim()]),
    )
  }, [documentType, fieldDrafts, run])
  const correctableFields =
    documentType === 'PASSPORT_COPY' || documentType === 'ARC'
      ? CORRECTABLE_FIELDS[documentType]
      : new Set<string>()
  const hasEmptyCorrection =
    Boolean(run?.result) &&
    Object.entries(fieldDrafts).some(
      ([field, value]) => correctableFields.has(field) && value.trim() === '',
    )

  async function handleCreate(forceNew = false) {
    if (forceNew) requestKeyRef.current = null
    requestKeyRef.current ??= crypto.randomUUID()
    setBusyAction('create')
    setRequestError(null)
    try {
      applyRun(await createDocumentOcrRun(documentId, requestKeyRef.current))
    } catch (error) {
      if (error instanceof ApiError && error.status === 503) {
        setPanelState('disabled')
      } else {
        setRequestError(messageFor(error))
      }
    } finally {
      setBusyAction(null)
    }
  }

  async function handleReview(decision: 'APPROVE' | 'REJECT') {
    if (!run || !REVIEWABLE_STATUSES.includes(run.status)) return
    if (decision === 'REJECT' && !rejectReason.trim()) return
    setBusyAction(decision === 'APPROVE' ? 'approve' : 'reject')
    setRequestError(null)
    try {
      const reviewed = await reviewDocumentOcrRun(documentId, run.ocr_run_id, {
        expected_version: run.version,
        decision,
        reason: decision === 'REJECT' ? rejectReason.trim() : undefined,
        corrected_fields: decision === 'APPROVE' ? changedFields : {},
      })
      applyRun(reviewed)
    } catch (error) {
      setRequestError(messageFor(error))
    } finally {
      setBusyAction(null)
    }
  }

  if (!supported) {
    return (
      <section className={styles.panel} aria-labelledby="document-ocr-title">
        <h2 id="document-ocr-title">문서 OCR</h2>
        <p className={styles.notice}>현재 여권 사본과 외국인등록증만 OCR을 지원합니다.</p>
      </section>
    )
  }

  if (!fileId) {
    return (
      <section className={styles.panel} aria-labelledby="document-ocr-title">
        <h2 id="document-ocr-title">문서 OCR</h2>
        <p className={styles.notice}>연결된 파일이 없어 OCR을 실행할 수 없습니다.</p>
      </section>
    )
  }

  return (
    <section className={styles.panel} aria-labelledby="document-ocr-title">
      <div className={styles.panelHeader}>
        <div>
          <h2 id="document-ocr-title">문서 OCR</h2>
          <p>원본에서 정보를 추출한 뒤 담당자가 수정하고 검토 상태를 확정합니다.</p>
        </div>
        {run && (
          <StatusLabel tone={STATUS_PRESENTATION[run.status].tone}>
            {STATUS_PRESENTATION[run.status].label}
          </StatusLabel>
        )}
      </div>

      {requestError && (
        <div className={styles.error} role="alert">
          {requestError}
        </div>
      )}

      {panelState === 'loading' && (
        <p className={styles.notice}>최신 OCR 상태를 확인하고 있습니다.</p>
      )}

      {panelState === 'disabled' && (
        <p className={styles.notice}>
          OCR 기능 준비 중입니다. 기능이 활성화되면 다시 시도해 주세요.
        </p>
      )}

      {panelState === 'error' && (
        <div className={styles.stateAction}>
          <p className={styles.notice}>OCR 상태를 불러오지 못했습니다.</p>
          <Button variant="secondary" onClick={loadLatest}>
            다시 불러오기
          </Button>
        </div>
      )}

      {panelState === 'empty' && (
        <div className={styles.stateAction}>
          <p className={styles.notice}>아직 이 문서의 OCR 실행 이력이 없습니다.</p>
          <Button isLoading={busyAction === 'create'} onClick={() => handleCreate()}>
            OCR 실행
          </Button>
        </div>
      )}

      {panelState === 'ready' && run && PROCESSING_STATUSES.includes(run.status) && (
        <div className={styles.processing} aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <strong>OCR 결과를 확인하는 중입니다.</strong>
            <p>완료될 때까지 자동으로 상태를 확인합니다.</p>
          </div>
        </div>
      )}

      {panelState === 'ready' && run?.status === 'FAILED' && (
        <div className={styles.stateAction}>
          <p className={styles.notice}>
            OCR 실행을 완료하지 못했습니다{run.error_code ? ` · ${run.error_code}` : ''}
          </p>
          <Button isLoading={busyAction === 'create'} onClick={() => handleCreate(true)}>
            새로 실행
          </Button>
        </div>
      )}

      {panelState === 'ready' && run?.result && (
        <>
          {run.result.review_reasons.length > 0 && (
            <div className={styles.reviewReasons}>
              <strong>원본 대조가 필요한 이유</strong>
              <ul>
                {run.result.review_reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.fieldList}>
            {Object.entries(run.result.fields).map(([field, originalValue]) => {
              const confidence = run.result?.field_confidences[field]
              const editable = correctableFields.has(field)
              return (
                <label key={field} className={styles.fieldRow}>
                  <span>
                    <strong>{FIELD_LABEL[field] ?? field}</strong>
                    {confidence !== undefined && <small>{Math.round(confidence * 100)}%</small>}
                  </span>
                  {editable && REVIEWABLE_STATUSES.includes(run.status) ? (
                    <input
                      value={fieldDrafts[field] ?? originalValue}
                      onChange={(event) =>
                        setFieldDrafts((current) => ({ ...current, [field]: event.target.value }))
                      }
                    />
                  ) : (
                    <output>{fieldDrafts[field] ?? originalValue}</output>
                  )}
                  {editable &&
                    REVIEWABLE_STATUSES.includes(run.status) &&
                    (fieldDrafts[field] ?? originalValue) !== originalValue && (
                      <small className={styles.originalValue}>OCR 추출값 · {originalValue}</small>
                    )}
                </label>
              )
            })}
          </div>

          <p className={styles.scopeNote}>
            승인해도 근로자 정보는 자동 변경되지 않습니다. 이 화면의 OCR 검토만 완료됩니다.
          </p>

          {REVIEWABLE_STATUSES.includes(run.status) && (
            <div className={styles.reviewArea}>
              {hasEmptyCorrection && (
                <p className={styles.correctionWarning}>
                  추출 필드는 빈 값으로 승인할 수 없습니다.
                </p>
              )}
              <label className={styles.rejectReason}>
                <span>반려 사유</span>
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  maxLength={300}
                  placeholder="반려할 때만 입력해 주세요."
                />
              </label>
              <div className={styles.reviewActions}>
                <Button
                  variant="secondary"
                  disabled={!rejectReason.trim() || busyAction !== null}
                  isLoading={busyAction === 'reject'}
                  onClick={() => handleReview('REJECT')}
                >
                  반려
                </Button>
                <Button
                  disabled={busyAction !== null || hasEmptyCorrection}
                  isLoading={busyAction === 'approve'}
                  onClick={() => handleReview('APPROVE')}
                >
                  OCR 검토 완료
                </Button>
              </div>
            </div>
          )}

          {run.status === 'APPROVED' && (
            <p className={styles.reviewedNotice}>OCR 검토를 완료했습니다.</p>
          )}
          {run.status === 'REJECTED' && (
            <p className={styles.reviewedNotice}>OCR 결과를 반려했습니다. {run.review_reason}</p>
          )}
        </>
      )}
    </section>
  )
}
