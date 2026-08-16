import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { DocumentItemResponse } from '../../../api/documents'
import { ApiError, getErrorMessage } from '../../../api/errors'
import {
  ensureStayVerification,
  updateStayVerification,
  type StayVerificationResponse,
  type StayVerificationStatus,
  type StayVerificationUpdateBody,
} from '../../../api/stayVerifications'
import {
  archiveWorker,
  fetchWorkerArchiveEligibility,
  type WorkerArchiveBlocker,
  type WorkerArchiveEligibilityResponse,
  type WorkerResponse,
} from '../../../api/workers'
import { Button } from '../../../components/ui/Button/Button'
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState'
import { Modal } from '../../../components/ui/Modal/Modal'
import styles from './StayVerificationModal.module.css'

export interface StayVerificationModalProps {
  open: boolean
  worker: WorkerResponse
  documents: DocumentItemResponse[]
  onClose: () => void
  onRegisterEvidence: () => void
}

const STATUS_OPTIONS: { value: StayVerificationStatus; label: string }[] = [
  { value: 'APPROVED', label: '연장 승인 완료' },
  { value: 'APPLICATION_PENDING', label: '기한 전 신청·심사 중' },
  { value: 'UNKNOWN', label: '신청 여부 불명확' },
  { value: 'NOT_APPLIED', label: '미신청 상태로 기간 경과' },
  { value: 'EMPLOYMENT_ENDED', label: '출국 또는 고용 종료 확인' },
]

const NEXT_ACTION: Record<StayVerificationStatus, string> = {
  APPROVED: '새 체류 만료일을 근로자 정보에 반영합니다.',
  APPLICATION_PENDING: '외부기관 결과를 기다리고 재확인일에 다시 확인합니다.',
  UNKNOWN: '공식기관 또는 보유 서류로 신청 여부를 확인합니다.',
  NOT_APPLIED: '고위험 HR 검토 상태를 유지하고 대응 방법을 확인합니다.',
  EMPLOYMENT_ENDED: '고용변동 Workflow 후보를 검토합니다. 근로자 상태는 자동 변경되지 않습니다.',
}

const BLOCKER_LABEL: Record<WorkerArchiveBlocker, string> = {
  ACTIVE_EMPLOYMENT_STATUS: '근무상태가 아직 재직 또는 휴직입니다.',
  OPEN_TASK: '완료되지 않은 업무가 있습니다.',
  PENDING_APPROVAL: '처리되지 않은 승인 요청이 있습니다.',
  ACTIVE_WORKER_LINK: '아직 유효한 근로자 보안 링크가 있습니다.',
  ALREADY_ARCHIVED: '이미 안전 보관된 근로자입니다.',
}

function today(): string {
  return localDateString(new Date())
}

function tomorrow(): string {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return localDateString(date)
}

function localDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readableError(error: unknown): string {
  return error instanceof ApiError
    ? getErrorMessage(error)
    : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

export function StayVerificationModal({
  open,
  worker,
  documents,
  onClose,
  onRegisterEvidence,
}: StayVerificationModalProps) {
  const [verification, setVerification] = useState<StayVerificationResponse | null>(null)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [loadError, setLoadError] = useState('')
  const [status, setStatus] = useState<StayVerificationStatus>('UNKNOWN')
  const [evidenceDocumentId, setEvidenceDocumentId] = useState('')
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [appliedAt, setAppliedAt] = useState(today())
  const [recheckDate, setRecheckDate] = useState(tomorrow())
  const [note, setNote] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [archiveEligibility, setArchiveEligibility] =
    useState<WorkerArchiveEligibilityResponse | null>(null)
  const [archiveReason, setArchiveReason] = useState('고용 종료 확인 후 운영 목록에서 안전 보관')
  const [archiving, setArchiving] = useState(false)
  const [archived, setArchived] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadState('loading')
    setLoadError('')
    setSubmitError('')
    setSaved(false)
    setArchived(false)
    setArchiveEligibility(null)

    ensureStayVerification(worker.worker_id)
      .then((result) => {
        if (cancelled) return
        if (!result) {
          setLoadState('error')
          setLoadError('체류기간 경과 확인 대상을 만들 수 없습니다. 만료일을 다시 확인해 주세요.')
          return
        }
        setVerification(result)
        setStatus(result.verification_status)
        setEvidenceDocumentId(
          result.approval_result_document_id ?? result.extension_receipt_document_id ?? '',
        )
        setNewExpiryDate(result.new_stay_expiry_date ?? '')
        setAppliedAt(result.extension_applied_at ?? today())
        setRecheckDate(result.recheck_date ?? tomorrow())
        setNote(result.official_consultation_note ?? '')
        setLoadState('success')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoadState('error')
        setLoadError(readableError(error))
      })

    return () => {
      cancelled = true
    }
  }, [open, worker.worker_id])

  const evidenceRequired = status === 'APPROVED' || status === 'APPLICATION_PENDING'
  const noteRequired = status === 'NOT_APPLIED' || status === 'EMPLOYMENT_ENDED'
  const formError = useMemo(() => {
    if (evidenceRequired && !evidenceDocumentId) return '등록된 증빙 서류를 선택해 주세요.'
    if (status === 'APPROVED' && !newExpiryDate) return '승인된 새 체류 만료일을 입력해 주세요.'
    if (
      status === 'APPROVED' &&
      verification &&
      newExpiryDate <= verification.source_stay_expiry_date
    ) {
      return '새 체류 만료일은 기존 만료일보다 뒤여야 합니다.'
    }
    if (status === 'APPLICATION_PENDING' && (!appliedAt || !recheckDate)) {
      return '신청일과 재확인일을 입력해 주세요.'
    }
    if (status === 'APPLICATION_PENDING' && recheckDate <= today()) {
      return '재확인일은 내일 이후로 입력해 주세요.'
    }
    if (noteRequired && !note.trim()) return '확인 근거 또는 담당자 메모를 입력해 주세요.'
    return ''
  }, [
    appliedAt,
    evidenceDocumentId,
    evidenceRequired,
    newExpiryDate,
    note,
    noteRequired,
    recheckDate,
    status,
    verification,
  ])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!verification || formError) return
    setSaving(true)
    setSubmitError('')

    const body: StayVerificationUpdateBody = {
      status,
      expected_version: verification.version,
    }
    if (note.trim()) body.official_consultation_note = note.trim()
    if (status === 'APPROVED') {
      body.new_stay_expiry_date = newExpiryDate
      body.approval_result_document_id = evidenceDocumentId
    }
    if (status === 'APPLICATION_PENDING') {
      body.extension_applied_at = appliedAt
      body.recheck_date = recheckDate
      body.extension_receipt_document_id = evidenceDocumentId
    }
    if (status === 'EMPLOYMENT_ENDED') {
      body.employment_end_confirmed_at = new Date().toISOString()
    }

    try {
      const updated = await updateStayVerification(verification.stay_verification_id, body)
      setVerification(updated)
      setSaved(true)
      if (updated.verification_status === 'EMPLOYMENT_ENDED') {
        try {
          const eligibility = await fetchWorkerArchiveEligibility(worker.worker_id)
          setArchiveEligibility(eligibility)
        } catch {
          setSubmitError('확인 결과는 저장했지만 안전 보관 가능 여부를 불러오지 못했습니다.')
        }
      } else {
        setArchiveEligibility(null)
      }
    } catch (error) {
      setSubmitError(readableError(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive() {
    if (!archiveEligibility?.archivable || !archiveReason.trim()) return
    setArchiving(true)
    setSubmitError('')
    try {
      await archiveWorker(worker.worker_id, archiveReason.trim(), archiveEligibility.worker_version)
      setArchived(true)
    } catch (error) {
      setSubmitError(readableError(error))
    } finally {
      setArchiving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="체류상태 긴급 확인" size="wide">
      {loadState === 'loading' && (
        <EmptyState
          kind="loading"
          title="확인 대상을 준비하는 중입니다"
          body="잠시만 기다려 주세요."
        />
      )}
      {loadState === 'error' && (
        <EmptyState kind="error" title="체류상태 확인을 시작하지 못했습니다" body={loadError} />
      )}
      {loadState === 'success' && verification && (
        <form onSubmit={handleSubmit}>
          <div className={styles.notice}>
            <strong>기록상 체류 만료일이 지났습니다.</strong>
            <span>이 화면은 법적 체류 상태나 퇴사 여부를 자동으로 확정하지 않습니다.</span>
          </div>

          <dl className={styles.summary}>
            <div>
              <dt>근로자</dt>
              <dd>{worker.display_name}</dd>
            </div>
            <div>
              <dt>기록상 만료일</dt>
              <dd>{verification.source_stay_expiry_date}</dd>
            </div>
          </dl>

          <fieldset className={styles.fieldset}>
            <legend>HR 확인 결과</legend>
            <div className={styles.optionGrid}>
              {STATUS_OPTIONS.map((option) => (
                <label key={option.value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="stay-status"
                    value={option.value}
                    checked={status === option.value}
                    onChange={() => {
                      setStatus(option.value)
                      setSaved(false)
                      setArchiveEligibility(null)
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {status === 'APPROVED' && (
            <label className={styles.fieldLabel}>
              승인된 새 체류 만료일
              <input
                className={styles.input}
                type="date"
                value={newExpiryDate}
                min={verification.source_stay_expiry_date}
                onChange={(event) => setNewExpiryDate(event.target.value)}
              />
            </label>
          )}

          {status === 'APPLICATION_PENDING' && (
            <div className={styles.dateGrid}>
              <label className={styles.fieldLabel}>
                신청일
                <input
                  className={styles.input}
                  type="date"
                  value={appliedAt}
                  onChange={(event) => setAppliedAt(event.target.value)}
                />
              </label>
              <label className={styles.fieldLabel}>
                재확인일
                <input
                  className={styles.input}
                  type="date"
                  value={recheckDate}
                  min={tomorrow()}
                  onChange={(event) => setRecheckDate(event.target.value)}
                />
              </label>
            </div>
          )}

          {evidenceRequired && (
            <label className={styles.fieldLabel}>
              {status === 'APPROVED' ? '승인 결과 증빙' : '연장 신청 접수증'}
              <select
                className={styles.input}
                value={evidenceDocumentId}
                onChange={(event) => setEvidenceDocumentId(event.target.value)}
              >
                <option value="">등록된 서류 선택</option>
                {documents.map((document) => (
                  <option key={document.worker_document_id} value={document.worker_document_id}>
                    {document.document_type} · {document.worker_document_id}
                  </option>
                ))}
              </select>
              {documents.length === 0 && (
                <span className={styles.helpRow}>
                  <span>승인·접수 증빙을 먼저 등록해 주세요.</span>
                  <button
                    type="button"
                    className={styles.inlineButton}
                    onClick={onRegisterEvidence}
                  >
                    증빙 서류 등록
                  </button>
                </span>
              )}
            </label>
          )}

          <label className={styles.fieldLabel}>
            확인 메모 {noteRequired ? '(필수)' : '(선택)'}
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={note}
              maxLength={1000}
              placeholder="확인한 기관·일시·근거를 개인정보 원문 없이 기록해 주세요."
              onChange={(event) => setNote(event.target.value)}
            />
          </label>

          <div className={styles.nextAction}>
            <strong>저장 후 다음 행동</strong>
            <span>{NEXT_ACTION[status]}</span>
          </div>

          {(formError || submitError) && (
            <p className={styles.error} role="alert">
              {submitError || formError}
            </p>
          )}
          {saved && <p className={styles.success}>확인 결과와 근거를 저장했습니다.</p>}

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={onClose}>
              닫기
            </Button>
            <Button type="submit" isLoading={saving} disabled={Boolean(formError)}>
              확인 결과 저장
            </Button>
          </div>

          {status === 'EMPLOYMENT_ENDED' && saved && archiveEligibility && (
            <section className={styles.archiveSection} aria-label="근로자 안전 보관">
              <h3>운영 목록 안전 보관</h3>
              <p>과거 업무·문서·감사 이력은 삭제하지 않고 유지합니다.</p>
              {!archiveEligibility.archivable ? (
                <ul>
                  {archiveEligibility.blockers.map((blocker) => (
                    <li key={blocker}>{BLOCKER_LABEL[blocker]}</li>
                  ))}
                </ul>
              ) : (
                <>
                  <label className={styles.fieldLabel}>
                    보관 사유
                    <input
                      className={styles.input}
                      value={archiveReason}
                      maxLength={500}
                      onChange={(event) => setArchiveReason(event.target.value)}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    isLoading={archiving}
                    disabled={archived || !archiveReason.trim()}
                    onClick={handleArchive}
                  >
                    {archived ? '안전 보관 완료' : '운영 목록에서 안전 보관'}
                  </Button>
                </>
              )}
            </section>
          )}
        </form>
      )}
    </Modal>
  )
}
