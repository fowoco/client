import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../api/errors'
import { fetchAiRun, type AiRunResponse } from '../../api/aiRuns'
import { WorkflowStepIndicator } from '../../components/ui/WorkflowStepIndicator/WorkflowStepIndicator'
import {
  readAiRunWorkRequestDraft,
  type WorkRequestDraft,
} from '../CreateWorkPage/workRequestDraft'
import { AiRunReview } from './AiRunReview'
import styles from './ReviewWorkPage.module.css'
import { REVIEW_STEPS } from './reviewWorkData'
import { DraftPreparationStep } from './steps/DraftPreparationStep'
import { FinalReviewStep } from './steps/FinalReviewStep'
import { InformationPendingStep } from './steps/InformationPendingStep'

// REVIEW_STEPS 인덱스 기준 2~4단계(정보 보완/초안 준비/최종 검토) 내부 위저드.
// 1.요청 확인은 CreateWorkPage(/tasks/new)에서 진행되고, 같은 WorkflowStepIndicator를 공유한다.
type WizardStepIndex = 1 | 2 | 3

interface ReviewLocationState {
  aiRun?: AiRunResponse
  draft?: WorkRequestDraft
}

function parseStepIndex(value: string | null): WizardStepIndex {
  const parsed = Number(value)
  return parsed === 2 || parsed === 3 ? parsed : 1
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
  const [stepIndex, setStepIndex] = useState<WizardStepIndex>(() => parseStepIndex(searchParams.get('step')))
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

  function handleStepClick(index: number) {
    if (index === 0) {
      navigate('/tasks/new')
      return
    }
    setStepIndex(index as WizardStepIndex)
  }

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

  return (
    <div>
      <div className={styles.topBar}>
        <Link to="/tasks/new" className={styles.back}>
          ← 업무 생성
        </Link>
      </div>

      <WorkflowStepIndicator steps={REVIEW_STEPS} currentIndex={stepIndex} onStepClick={handleStepClick} />

      {stepIndex === 1 && <InformationPendingStep onComplete={() => setStepIndex(2)} />}
      {stepIndex === 2 && <DraftPreparationStep onDone={() => setStepIndex(3)} />}
      {stepIndex === 3 && <FinalReviewStep />}
    </div>
  )
}
