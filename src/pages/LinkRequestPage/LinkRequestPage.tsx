import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../api/errors'
import {
  fetchWorkerLink,
  getWorkerAnswerActions,
  getWorkerRequestedDocumentTypes,
  submitWorkerResponse,
  type WorkerAnswerAction,
  type WorkerResponseSubmitResponse,
} from '../../api/workerLinks'
import { MobileShell } from '../../components/mobile/MobileShell'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { useApiQuery } from '../../hooks/useApiQuery'
import { DOCUMENT_TYPE_LABEL } from '../../utils/documentLabels'
import { getOperationalDateViewModel } from '../../view-models/dateViewModel'
import styles from './LinkRequestPage.module.css'
import {
  clearSlotAnswerSubmission,
  getSlotAnswerActionSignature,
  readSlotAnswerSubmission,
  saveSlotAnswerSubmission,
} from './slotAnswerSubmission'

const LANGUAGE_LABEL: Record<string, string> = {
  ko: '한국어',
  vi: '베트남어',
  en: '영어',
  zh: '중국어',
  th: '태국어',
  id: '인도네시아어',
  km: '크메르어',
  mn: '몽골어',
  uz: '우즈베크어',
  ne: '네팔어',
}

function answerInputHint(action: WorkerAnswerAction) {
  if (action.input_type === 'MONEY') return '숫자만 입력해 주세요.'
  if (action.input_type === 'BOOLEAN') return '예 또는 아니요를 선택해 주세요.'
  return '500자 이내로 입력해 주세요.'
}

export function LinkRequestPage() {
  const { token } = useParams()

  if (!token) {
    return (
      <MobileShell right={<span>보안 링크</span>}>
        <EmptyState
          kind="error"
          title="제출 링크가 필요합니다"
          body="회사 담당자가 전달한 전체 링크를 다시 열어 주세요."
        />
      </MobileShell>
    )
  }

  return <WorkerLinkRequest token={token} />
}

function WorkerLinkRequest({ token }: { token: string }) {
  const navigate = useNavigate()
  const [submittingQuestion, setSubmittingQuestion] = useState(false)
  const [submittingAcknowledgement, setSubmittingAcknowledgement] = useState(false)
  const [questionSent, setQuestionSent] = useState(false)
  const [questionComposerOpen, setQuestionComposerOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [responseError, setResponseError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submittingAnswers, setSubmittingAnswers] = useState(false)
  const [answerSubmission, setAnswerSubmission] = useState<WorkerResponseSubmitResponse | null>(
    null,
  )
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [answerRequestId, setAnswerRequestId] = useState<string | null>(null)
  const fetcher = useCallback(() => fetchWorkerLink(token), [token])
  const { status, data, error, refetch } = useApiQuery(fetcher)
  const answerActions = data ? getWorkerAnswerActions(data) : []
  const answerActionSignature = getSlotAnswerActionSignature(answerActions)

  useEffect(() => {
    if (status === 'error' && error?.status === 410) {
      navigate(`/worker-portal/${encodeURIComponent(token)}/expired`, { replace: true })
    }
  }, [error, navigate, status, token])

  useEffect(() => {
    if (status !== 'success' || !data) return
    const stored = readSlotAnswerSubmission(token, answerActionSignature)
    if (!answerActionSignature) {
      setAnswers({})
      setAnswerRequestId(stored?.idempotencyKey ?? null)
      setAnswerSubmission(stored?.submission ?? null)
      return
    }

    setAnswers(stored?.answers ?? {})
    setAnswerRequestId(stored?.idempotencyKey ?? null)
    setAnswerSubmission(stored?.submission ?? null)
  }, [answerActionSignature, data, status, token])

  function handleAnswerChange(fieldKey: string, value: string) {
    setAnswers((current) => ({ ...current, [fieldKey]: value }))
    setAnswerError(null)

    if (answerRequestId) {
      clearSlotAnswerSubmission(token)
      setAnswerRequestId(null)
    }
  }

  async function handleAnswerSubmit() {
    if (!data || submittingAnswers || answerActions.length === 0) return

    const submittedAnswers: Record<string, string> = {}
    for (const action of answerActions) {
      const value = answers[action.field_key]?.trim() ?? ''
      if (action.required && !value) {
        setAnswerError(`“${action.label}” 항목에 답변해 주세요.`)
        return
      }
      if (!value) continue
      if (action.input_type === 'TEXT' && value.length > 500) {
        setAnswerError(`“${action.label}” 답변은 500자 이내로 입력해 주세요.`)
        return
      }
      if (action.input_type === 'MONEY' && !/^\d{1,12}$/.test(value)) {
        setAnswerError(`“${action.label}” 항목에는 12자리 이하의 숫자만 입력해 주세요.`)
        return
      }
      submittedAnswers[action.field_key] = value
    }

    const idempotencyKey = answerRequestId ?? crypto.randomUUID()
    setAnswerRequestId(idempotencyKey)
    setSubmittingAnswers(true)
    setAnswerError(null)
    saveSlotAnswerSubmission(token, answerActionSignature, submittedAnswers, idempotencyKey, null)

    try {
      const result = await submitWorkerResponse(token, {
        response_type: 'SLOT_ANSWERS_SUBMITTED',
        answers: submittedAnswers,
        idempotency_key: idempotencyKey,
      })
      setAnswerSubmission(result)
      saveSlotAnswerSubmission(token, answerActionSignature, {}, idempotencyKey, result)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 410) {
        navigate(`/worker-portal/${encodeURIComponent(token)}/expired`, { replace: true })
        return
      }
      if (caught instanceof ApiError && caught.status === 409) {
        clearSlotAnswerSubmission(token)
        setAnswerRequestId(null)
        setAnswerError(
          '이전 제출 요청과 내용이 달라 전송하지 못했습니다. 내용을 확인한 뒤 다시 제출해 주세요.',
        )
        return
      }
      if (caught instanceof ApiError && caught.status === 422) {
        clearSlotAnswerSubmission(token)
        setAnswerRequestId(null)
        setAnswerError('요청된 형식과 맞지 않는 답변이 있습니다. 입력 내용을 확인해 주세요.')
        return
      }
      setAnswerError(
        caught instanceof ApiError ? getErrorMessage(caught) : '답변을 제출하지 못했습니다.',
      )
    } finally {
      setSubmittingAnswers(false)
    }
  }

  async function handleQuestion() {
    if (submittingQuestion) return
    const message = question.trim()
    if (!message) {
      setResponseError('담당자에게 보낼 질문을 입력해 주세요.')
      return
    }
    setSubmittingQuestion(true)
    setResponseError(null)
    try {
      await submitWorkerResponse(token, {
        response_type: 'QUESTION',
        message,
        idempotency_key: crypto.randomUUID(),
      })
      setQuestionSent(true)
    } catch (caught) {
      setResponseError(
        caught instanceof ApiError ? getErrorMessage(caught) : '응답을 보내지 못했습니다.',
      )
    } finally {
      setSubmittingQuestion(false)
    }
  }

  async function handleAcknowledgement() {
    if (submittingAcknowledgement) return
    setSubmittingAcknowledgement(true)
    setResponseError(null)
    try {
      if (data?.allowed_responses.includes('ACKNOWLEDGED')) {
        await submitWorkerResponse(token, {
          response_type: 'ACKNOWLEDGED',
          idempotency_key: crypto.randomUUID(),
        })
      }
      navigate(`/worker-portal/${encodeURIComponent(token)}/upload`)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 410) {
        navigate(`/worker-portal/${encodeURIComponent(token)}/expired`, { replace: true })
        return
      }
      setResponseError(
        caught instanceof ApiError ? getErrorMessage(caught) : '확인 응답을 보내지 못했습니다.',
      )
    } finally {
      setSubmittingAcknowledgement(false)
    }
  }

  if (status === 'loading') {
    return (
      <MobileShell right={<span>보안 링크</span>}>
        <EmptyState
          kind="loading"
          title="요청 내용을 확인하고 있습니다"
          body="잠시만 기다려 주세요."
        />
      </MobileShell>
    )
  }

  if (status === 'error' || !data) {
    const contentNotReady =
      error instanceof ApiError && error.code === 'WORKER_LINK_CONTENT_NOT_READY'
    return (
      <MobileShell right={<span>보안 링크</span>}>
        <EmptyState
          kind="error"
          title={
            contentNotReady ? '요청 내용을 준비하고 있습니다' : '요청 내용을 불러오지 못했습니다'
          }
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

  const due = getOperationalDateViewModel('TASK_DUE', data.due_date)
  const requestedDocumentTypes = getWorkerRequestedDocumentTypes(data)
  const canContinue =
    data.allowed_responses.includes('ACKNOWLEDGED') ||
    data.allowed_responses.includes('DOCUMENT_SUBMITTED')
  const canAskQuestion = data.allowed_responses.includes('QUESTION')
  const canSubmitAnswers = data.allowed_responses.includes('SLOT_ANSWERS_SUBMITTED')

  return (
    <MobileShell right={<span>보안 링크</span>}>
      <div className={styles.expiryNotice}>
        <p className={styles.expiryTitle}>회사에서 발급한 제출 링크입니다.</p>
        <p className={styles.expiryBody}>이 화면을 닫아도 같은 링크로 다시 열 수 있습니다.</p>
      </div>

      <p className={styles.requester}>회사 인사팀 요청</p>
      <h1 className={styles.headline}>
        요청 내용을
        <br />
        확인해 주세요
      </h1>
      <p className={styles.deadline}>{due.display}</p>
      <p className={styles.language}>{LANGUAGE_LABEL[data.language] ?? data.language} 안내</p>

      <hr className={styles.divider} />

      <p className={styles.body}>{data.guidance}</p>

      {(answerActions.length > 0 || answerSubmission) && (
        <section className={styles.answerSection} aria-labelledby="requested-answers-title">
          <div className={styles.answerSectionHeader}>
            <div>
              <p className={styles.answerEyebrow}>회사에서 요청한 정보</p>
              <h2 id="requested-answers-title" className={styles.answerTitle}>
                {answerActions.length > 0
                  ? `답변할 항목 ${answerActions.length}개`
                  : '답변 제출 현황'}
              </h2>
            </div>
            {answerActions.length > 0 && (
              <span className={styles.requiredNotice}>요청 항목만 표시</span>
            )}
          </div>

          {answerSubmission ? (
            <div className={styles.answerProcessing} role="status">
              <span className={styles.processingIcon}>✓</span>
              <div>
                <p className={styles.processingTitle}>답변 제출 · 처리 중</p>
                <p className={styles.processingBody}>
                  제출한 답변을 Agent가 업무에 반영하고 있습니다. 아직 업무가 완료된 것은 아닙니다.
                </p>
                <p className={styles.processingMeta}>접수 ID · {answerSubmission.response_id}</p>
              </div>
              <button type="button" className={styles.refreshAction} onClick={refetch}>
                처리 상태 새로고침
              </button>
            </div>
          ) : (
            <>
              <div className={styles.answerFields}>
                {answerActions.map((action) => {
                  const inputId = `worker-answer-${action.field_key}`
                  const hintId = `${inputId}-hint`
                  const value = answers[action.field_key] ?? ''

                  return (
                    <div key={action.field_key} className={styles.answerField}>
                      <label className={styles.answerLabel} htmlFor={inputId}>
                        {action.label}
                        {action.required && <span aria-label="필수 입력"> *</span>}
                      </label>
                      {action.input_type === 'BOOLEAN' ? (
                        <div
                          id={inputId}
                          className={styles.booleanOptions}
                          role="radiogroup"
                          aria-label={action.label}
                          aria-describedby={hintId}
                        >
                          {[
                            ['true', '예'],
                            ['false', '아니요'],
                          ].map(([optionValue, optionLabel]) => (
                            <label
                              key={optionValue}
                              className={`${styles.booleanOption} ${value === optionValue ? styles.booleanOptionSelected : ''}`}
                            >
                              <input
                                type="radio"
                                name={inputId}
                                value={optionValue}
                                checked={value === optionValue}
                                disabled={submittingAnswers}
                                onChange={(event) =>
                                  handleAnswerChange(action.field_key, event.target.value)
                                }
                              />
                              <span>{optionLabel}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.textInputWrap}>
                          <input
                            id={inputId}
                            className={styles.answerInput}
                            type="text"
                            inputMode={action.input_type === 'MONEY' ? 'numeric' : 'text'}
                            maxLength={action.input_type === 'MONEY' ? 12 : 500}
                            value={value}
                            disabled={submittingAnswers}
                            aria-describedby={hintId}
                            placeholder={action.input_type === 'MONEY' ? '예: 300000' : '답변 입력'}
                            onChange={(event) =>
                              handleAnswerChange(
                                action.field_key,
                                action.input_type === 'MONEY'
                                  ? event.target.value.replace(/\D/g, '').slice(0, 12)
                                  : event.target.value,
                              )
                            }
                          />
                          {action.input_type === 'MONEY' && (
                            <span className={styles.inputSuffix}>원</span>
                          )}
                        </div>
                      )}
                      <p id={hintId} className={styles.answerHint}>
                        {answerInputHint(action)}
                      </p>
                    </div>
                  )
                })}
              </div>

              {answerError && (
                <p className={styles.answerError} role="alert">
                  {answerError}
                </p>
              )}
              <button
                type="button"
                className={styles.answerSubmit}
                disabled={!canSubmitAnswers || submittingAnswers}
                onClick={handleAnswerSubmit}
              >
                {submittingAnswers ? '답변 제출 중…' : '답변 제출'}
              </button>
            </>
          )}
        </section>
      )}

      {requestedDocumentTypes.length > 0 && (
        <section className={styles.requestedDocuments} aria-labelledby="requested-documents-title">
          <p id="requested-documents-title" className={styles.requestedDocumentsTitle}>
            제출할 서류 {requestedDocumentTypes.length}개
          </p>
          <ul className={styles.requestedDocumentsList}>
            {requestedDocumentTypes.map((type) => (
              <li key={type}>{DOCUMENT_TYPE_LABEL[type]}</li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.privacy}>
        <p className={styles.privacyTitle}>이 업무에 필요한 정보만 표시됩니다.</p>
        <p className={styles.privacyBody}>선택한 파일은 이 보안 링크의 업무에만 연결됩니다.</p>
      </div>

      {questionComposerOpen && !questionSent && (
        <section className={styles.questionComposer}>
          <label className={styles.questionLabel} htmlFor="worker-question">
            담당자에게 물어볼 내용
          </label>
          <textarea
            id="worker-question"
            className={styles.questionInput}
            value={question}
            maxLength={1000}
            placeholder="예: 여권 사진은 어느 면을 찍어야 하나요?"
            disabled={submittingQuestion}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <div className={styles.questionFooter}>
            <span>{question.length}/1000</span>
            <button
              type="button"
              className={styles.questionSubmit}
              disabled={submittingQuestion || !question.trim()}
              onClick={handleQuestion}
            >
              {submittingQuestion ? '전송 중…' : '질문 보내기'}
            </button>
          </div>
        </section>
      )}
      {questionSent && <p className={styles.responseNotice}>담당자에게 질문을 전송했습니다.</p>}
      {responseError && (
        <p className={styles.responseError} role="alert">
          {responseError}
        </p>
      )}

      {(canAskQuestion || requestedDocumentTypes.length > 0) && (
        <div className={styles.actions}>
          {canAskQuestion && (
            <button
              type="button"
              className={styles.secondary}
              disabled={submittingQuestion || submittingAcknowledgement || questionSent}
              onClick={() => {
                setQuestionComposerOpen(true)
                setResponseError(null)
              }}
            >
              {questionSent
                ? '질문 전송됨'
                : questionComposerOpen
                  ? '질문 작성 중'
                  : '질문이 있습니다'}
            </button>
          )}
          {requestedDocumentTypes.length > 0 && (
            <button
              type="button"
              className={styles.primary}
              disabled={!canContinue || submittingAcknowledgement}
              onClick={handleAcknowledgement}
            >
              {submittingAcknowledgement ? '확인 중…' : '서류 제출 화면으로 이동'}
            </button>
          )}
        </div>
      )}

      {requestedDocumentTypes.length > 0 && (
        <p className={styles.footnote}>다음 화면에서 요청받은 파일을 선택해 제출할 수 있습니다.</p>
      )}
    </MobileShell>
  )
}
