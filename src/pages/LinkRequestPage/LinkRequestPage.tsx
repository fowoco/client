import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../api/errors'
import { fetchWorkerLink, submitWorkerResponse } from '../../api/workerLinks'
import { MobileShell } from '../../components/mobile/MobileShell'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { useApiQuery } from '../../hooks/useApiQuery'
import { getOperationalDateViewModel } from '../../view-models/dateViewModel'
import styles from './LinkRequestPage.module.css'

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
  const [questionSent, setQuestionSent] = useState(false)
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
    setSubmittingQuestion(true)
    setResponseError(null)
    try {
      await submitWorkerResponse(token, {
        response_type: 'QUESTION',
        idempotency_key: crypto.randomUUID(),
      })
      setQuestionSent(true)
    } catch (caught) {
      setResponseError(caught instanceof ApiError ? getErrorMessage(caught) : '응답을 보내지 못했습니다.')
    } finally {
      setSubmittingQuestion(false)
    }
  }

  if (status === 'loading') {
    return (
      <MobileShell right={<span>보안 링크</span>}>
        <EmptyState kind="loading" title="요청 내용을 확인하고 있습니다" body="잠시만 기다려 주세요." />
      </MobileShell>
    )
  }

  if (status === 'error' || !data) {
    return (
      <MobileShell right={<span>보안 링크</span>}>
        <EmptyState
          kind="error"
          title="요청 내용을 불러오지 못했습니다"
          body={error instanceof ApiError ? getErrorMessage(error) : '네트워크 상태를 확인해 주세요.'}
          actionLabel="다시 시도"
          onAction={refetch}
        />
      </MobileShell>
    )
  }

  const due = getOperationalDateViewModel('TASK_DUE', data.due_date)
  const canUpload = data.allowed_responses.includes('DOCUMENT_SUBMITTED')
  const canAskQuestion = data.allowed_responses.includes('QUESTION')

  return (
    <MobileShell right={<span>보안 링크</span>}>
      <div className={styles.expiryNotice}>
        <p className={styles.expiryTitle}>회사에서 발급한 제출 링크입니다.</p>
        <p className={styles.expiryBody}>이 화면을 닫아도 같은 링크로 다시 열 수 있습니다.</p>
      </div>

      <p className={styles.requester}>서류 제출 요청</p>
      <h1 className={styles.headline}>
        요청 내용을
        <br />
        확인해 주세요
      </h1>
      <p className={styles.deadline}>{due.display}</p>

      <hr className={styles.divider} />

      <p className={styles.body}>{data.guidance}</p>

      <div className={styles.privacy}>
        <p className={styles.privacyTitle}>이 업무에 필요한 정보만 표시됩니다.</p>
        <p className={styles.privacyBody}>선택한 파일은 이 보안 링크의 업무에만 연결됩니다.</p>
      </div>

      {questionSent && <p className={styles.responseNotice}>담당자에게 질문 의사를 전했습니다.</p>}
      {responseError && <p className={styles.responseError} role="alert">{responseError}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          disabled={!canAskQuestion || submittingQuestion || questionSent}
          onClick={handleQuestion}
        >
          {questionSent ? '질문 의사 전송됨' : '질문이 있습니다'}
        </button>
        <button
          type="button"
          className={styles.primary}
          disabled={!canUpload}
          onClick={() => navigate(`/worker-portal/${encodeURIComponent(token)}/upload`)}
        >
          서류 제출하기
        </button>
      </div>

      <p className={styles.footnote}>제출 결과는 담당자에게 전달되며 같은 요청의 중복 제출은 차단됩니다.</p>
    </MobileShell>
  )
}
