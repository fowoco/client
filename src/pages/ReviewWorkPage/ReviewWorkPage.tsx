import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../api/errors'
import { fetchAiRun, type AiRunResponse } from '../../api/aiRuns'
import {
  readAiRunWorkRequestDraft,
  type WorkRequestDraft,
} from '../CreateWorkPage/workRequestDraft'
import { AiRunReview } from './AiRunReview'
import styles from './ReviewWorkPage.module.css'

interface ReviewLocationState {
  aiRun?: AiRunResponse
  draft?: WorkRequestDraft
}

export function ReviewWorkPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigationState = location.state as ReviewLocationState | null
  const navigationRun = navigationState?.aiRun
  const aiRunId = searchParams.get('aiRunId')
  const [recoveredRun, setRecoveredRun] = useState<AiRunResponse | null>(null)
  const [recovering, setRecovering] = useState(Boolean(aiRunId && !navigationRun))
  const [recoveryError, setRecoveryError] = useState<string | null>(null)
  const aiRun = navigationRun ?? recoveredRun
  const draft = navigationState?.draft ?? (aiRunId ? readAiRunWorkRequestDraft(aiRunId) : null)

  useEffect(() => {
    if (!aiRunId || navigationRun) return

    let cancelled = false
    setRecovering(true)
    setRecoveryError(null)
    fetchAiRun(aiRunId)
      .then((run) => {
        if (!cancelled) setRecoveredRun(run)
      })
      .catch((error) => {
        if (!cancelled) {
          setRecoveryError(
            error instanceof ApiError ? getErrorMessage(error) : '분석 결과를 불러오지 못했습니다.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setRecovering(false)
      })

    return () => {
      cancelled = true
    }
  }, [aiRunId, navigationRun])

  // 분석 실행 번호(aiRunId) 없이 이 화면에 직접 들어오면 검토할 내용이 없다 — 요청 입력으로 되돌린다.
  useEffect(() => {
    if (!aiRunId && !navigationRun) navigate('/tasks/new', { replace: true })
  }, [aiRunId, navigationRun, navigate])

  if (aiRun) {
    return <AiRunReview initialRun={aiRun} initialDraft={draft} />
  }

  if (aiRunId) {
    return (
      <div>
        <div className={styles.topBar}>
          <Link to="/tasks/new" className={styles.back}>
            ← 요청 입력
          </Link>
        </div>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.headline}>
              {recovering
                ? 'Agent 분석 결과를 불러오고 있습니다.'
                : 'Agent 분석 결과를 불러오지 못했습니다.'}
            </h1>
            <p className={styles.description} role={recoveryError ? 'alert' : undefined}>
              {recoveryError ?? '저장된 분석 실행 번호로 최신 상태를 확인합니다.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
