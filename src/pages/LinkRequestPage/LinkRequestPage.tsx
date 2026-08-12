import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../api/errors'
import { fetchWorkerLink, submitWorkerResponse } from '../../api/workerLinks'
import { MobileShell } from '../../components/mobile/MobileShell'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { useApiQuery } from '../../hooks/useApiQuery'
import { DOCUMENT_TYPE_LABEL } from '../../utils/documentLabels'
import { getOperationalDateViewModel } from '../../view-models/dateViewModel'
import styles from './LinkRequestPage.module.css'

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
  const fetcher = useCallback(() => fetchWorkerLink(token), [token])
  const { status, data, error, refetch } = useApiQuery(fetcher)

  useEffect(() => {
    if (status === 'error' && error?.status === 410) {
      navigate(`/worker-portal/${encodeURIComponent(token)}/expired`, { replace: true })
    }
  }, [error, navigate, status, token])

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
  const requestedDocumentTypes = [...new Set(data.requested_document_types)]
  const canContinue =
    data.allowed_responses.includes('ACKNOWLEDGED') ||
    data.allowed_responses.includes('DOCUMENT_SUBMITTED')
  const canAskQuestion = data.allowed_responses.includes('QUESTION')

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

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          disabled={
            !canAskQuestion || submittingQuestion || submittingAcknowledgement || questionSent
          }
          onClick={() => {
            setQuestionComposerOpen(true)
            setResponseError(null)
          }}
        >
          {questionSent ? '질문 전송됨' : questionComposerOpen ? '질문 작성 중' : '질문이 있습니다'}
        </button>
        <button
          type="button"
          className={styles.primary}
          disabled={!canContinue || submittingAcknowledgement}
          onClick={handleAcknowledgement}
        >
          {submittingAcknowledgement ? '확인 중…' : '안내를 확인했습니다'}
        </button>
      </div>

      <p className={styles.footnote}>다음 화면에서 요청받은 파일을 선택해 제출할 수 있습니다.</p>
    </MobileShell>
  )
}
