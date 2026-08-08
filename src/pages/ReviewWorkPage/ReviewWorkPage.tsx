import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const navigationState = location.state as ReviewLocationState | null
  const navigationRun = navigationState?.aiRun
  const aiRunId = new URLSearchParams(location.search).get('aiRunId')
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
          setRecoveryError(error instanceof ApiError ? getErrorMessage(error) : '분석 결과를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setRecovering(false)
      })

    return () => {
      cancelled = true
    }
  }, [aiRunId, navigationRun])

  if (aiRun) {
    return <AiRunReview initialRun={aiRun} initialDraft={draft} />
  }

  return (
    <div>
      <div className={styles.topBar}>
        <Link to="/tasks/new" className={styles.back}>← 요청 입력</Link>
      </div>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>
            {recovering
              ? 'Agent 분석 결과를 불러오고 있습니다.'
              : recoveryError
                ? 'Agent 분석 결과를 불러오지 못했습니다.'
                : '검토할 분석 결과가 없습니다.'}
          </h1>
          <p className={styles.description} role={recoveryError ? 'alert' : undefined}>
            {recoveryError ??
              (recovering
                ? '저장된 분석 실행 번호로 최신 상태를 확인합니다.'
                : '요청 입력 화면에서 자연어 분석을 시작해 주세요. 예시 업무는 표시하지 않습니다.')}
          </p>
        </div>
      </div>
      {!recovering && (
        <div className={styles.actions}>
          <Link to="/tasks/new" className={styles.primaryLink}>요청 입력으로 이동</Link>
        </div>
      )}
    </div>
  )
}
