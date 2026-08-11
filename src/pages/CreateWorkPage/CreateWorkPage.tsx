import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../api/errors'
import { createAiRun } from '../../api/aiRuns'
import { Button } from '../../components/ui/Button/Button'
import { WorkflowStepIndicator } from '../../components/ui/WorkflowStepIndicator/WorkflowStepIndicator'
import { REVIEW_STEPS } from '../ReviewWorkPage/reviewWorkData'
import styles from '../ReviewWorkPage/ReviewWorkPage.module.css'
import { AGENT_SCOPE_NOTE } from './createWorkData'
import { ImportWizardModal } from './importWizard/ImportWizardModal'
import {
  saveActiveWorkRequestDraft,
  saveAiRunWorkRequestDraft,
  type WorkRequestDraft,
} from './workRequestDraft'

export function CreateWorkPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // HOME-001 대시보드의 AI 요청 프롬프트 칩·업무함의 "업무 준비" 액션에서 넘어온 경우
  // 선택한 문구를 원본 요청 초안으로 미리 채운다. 없으면 빈 값으로 시작해서 직접 입력한다.
  const routeState = location.state as {
    prefill?: string
    request?: string
    workerId?: string
  } | null
  const [requestText, setRequestText] = useState(routeState?.request ?? routeState?.prefill ?? '')
  const [importWizardOpen, setImportWizardOpen] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  async function handleAnalyze() {
    const instruction = requestText.trim()
    if (instruction === '' || analyzing) return

    setAnalyzing(true)
    setAnalysisError(null)
    try {
      // UI 분류값이나 Intent 코드를 붙이지 않고 사용자가 입력한 원문만 전달한다.
      const aiRun = await createAiRun(instruction, globalThis.crypto.randomUUID())
      const draft: WorkRequestDraft = {
        request: requestText,
        mode: 'nl',
        workerId: routeState?.workerId ?? '',
        attachments: [],
      }
      saveActiveWorkRequestDraft(draft)
      saveAiRunWorkRequestDraft(aiRun.ai_run_id, draft)
      navigate(`/tasks/new/review?aiRunId=${encodeURIComponent(aiRun.ai_run_id)}`, {
        state: { aiRun, draft },
      })
    } catch (error) {
      setAnalysisError(
        error instanceof ApiError ? getErrorMessage(error) : '요청을 분석하지 못했습니다.',
      )
    } finally {
      setAnalyzing(false)
    }
  }

  function handleStepClick(index: number) {
    if (index === 0) return
    navigate(`/tasks/new/review?step=${index}`)
  }

  return (
    <div>
      <div className={styles.topBar}>
        <Link to="/tasks" className={styles.back}>
          ← 업무함
        </Link>
      </div>

      <WorkflowStepIndicator steps={REVIEW_STEPS} currentIndex={0} onStepClick={handleStepClick} />

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>요청을 자연어로 입력해 주세요</h1>
          <p className={styles.description}>
            입력한 원문을 그대로 분석해서 처리할 업무 후보를 준비합니다.
          </p>
        </div>
      </div>

      <div className={styles.workspace}>
        <div className={styles.panel}>
          <div className={styles.railCardSubtle}>
            <div className={styles.railCardTitleRow}>
              <h2 className={styles.railCardTitle}>원본 요청</h2>
              <span className={`${styles.pill} ${styles.pillBrand}`}>HR 입력</span>
            </div>
            <textarea
              className={styles.requestTextarea}
              value={requestText}
              onChange={(event) => setRequestText(event.target.value)}
              placeholder="예: 응웬반A의 체류기간 연장 준비를 진행해줘. 여권 사본이 없으면 제출을 안내해줘."
              rows={5}
              maxLength={2000}
              aria-label="원본 요청"
            />
          </div>

          <button
            type="button"
            className={styles.railLink}
            onClick={() => setImportWizardOpen(true)}
          >
            파일로 근로자 명단 가져오기 →
          </button>
        </div>

        <div className={styles.railStack}>
          <div className={styles.railCardSubtle}>
            <p className={styles.railCardTitleBrand}>Agent가 준비하는 범위</p>
            <p className={styles.railCardMeta}>{AGENT_SCOPE_NOTE}</p>
          </div>
        </div>
      </div>

      <div className={styles.actionDock}>
        <div>
          <p className={styles.dockTitle}>
            원문을 분석하면 다음 화면에서 처리할 업무 후보를 확인합니다.
          </p>
        </div>
        <div className={styles.dockActions}>
          <Button
            onClick={handleAnalyze}
            isLoading={analyzing}
            disabled={requestText.trim() === ''}
          >
            정보 보완
          </Button>
        </div>
      </div>

      {analysisError && (
        <p className={styles.fieldError} role="alert">
          {analysisError}
        </p>
      )}

      <ImportWizardModal open={importWizardOpen} onClose={() => setImportWizardOpen(false)} />
    </div>
  )
}
