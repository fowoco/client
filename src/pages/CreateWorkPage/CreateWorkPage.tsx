import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../api/errors'
import { createAiRun } from '../../api/aiRuns'
import { Button } from '../../components/ui/Button/Button'
import { WorkflowStepIndicator } from '../../components/ui/WorkflowStepIndicator/WorkflowStepIndicator'
import { useToastStore } from '../../store/toastStore'
import { REVIEW_STEPS } from '../ReviewWorkPage/reviewWorkData'
import styles from '../ReviewWorkPage/ReviewWorkPage.module.css'
import {
  ACTION_DOCK,
  AGENT_SCOPE_NOTE,
  COMPOUND_REQUEST_NOTE,
  DEFAULT_ORIGINAL_REQUEST,
  REQUIRED_INFO_COUNT,
  REQUIRED_INFO_ROWS,
  SCENARIO_STATUS_LABEL,
  TARGET_CASE,
  UNDERSTOOD_WORK,
  WORKFLOW_TASKS,
  type InfoSourceTone,
} from './createWorkData'
import { ImportWizardModal } from './importWizard/ImportWizardModal'
import {
  saveActiveWorkRequestDraft,
  saveAiRunWorkRequestDraft,
  type WorkRequestDraft,
} from './workRequestDraft'

const TASK_STATUS_TONE: Record<string, string> = {
  current: 'pillBrand',
  pending: 'pillAmber',
  blocked: 'pillNeutral',
}

const INFO_SOURCE_TONE: Record<InfoSourceTone, string> = {
  neutral: 'pillNeutral',
  brand: 'pillBrand',
  amber: 'pillAmber',
}

export function CreateWorkPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // HOME-001 대시보드의 AI 요청 프롬프트 칩에서 넘어온 경우 선택한 문구를 원본 요청으로 보여준다.
  const routeState = location.state as { prefill?: string; request?: string } | null
  const originalRequest = routeState?.request ?? routeState?.prefill ?? DEFAULT_ORIGINAL_REQUEST
  const [importWizardOpen, setImportWizardOpen] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const showToast = useToastStore((state) => state.showToast)

  async function handleAnalyze() {
    const instruction = originalRequest.trim()
    if (instruction === '' || analyzing) return

    setAnalyzing(true)
    setAnalysisError(null)
    try {
      // UI 분류값이나 Intent 코드를 붙이지 않고 사용자가 입력한 원문만 전달한다.
      const aiRun = await createAiRun(instruction, globalThis.crypto.randomUUID())
      const draft: WorkRequestDraft = {
        request: originalRequest,
        mode: 'nl',
        workerId: '',
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

  function handleEditRequest() {
    // TODO(backend): PATCH /api/work-items/draft -> 원문 수정 반영
    showToast('원문 수정은 준비 중입니다.')
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
          <h1 className={styles.headline}>요청을 업무 단위로 확인해 주세요</h1>
          <p className={styles.description}>
            원문과 기존 데이터를 바탕으로 상위 업무 건의 지금 할 일을 정리했습니다.
          </p>
        </div>
        <span className={styles.scenarioPill}>{SCENARIO_STATUS_LABEL}</span>
      </div>

      <div className={styles.workspace}>
        <div className={styles.panel}>
          <div className={styles.railCardSubtle}>
            <div className={styles.railCardTitleRow}>
              <h2 className={styles.railCardTitle}>원본 요청</h2>
              <span className={`${styles.pill} ${styles.pillBrand}`}>HR 입력</span>
            </div>
            {originalRequest.split('\n').map((line) => (
              <p key={line} className={styles.railCardMeta}>
                {line}
              </p>
            ))}
          </div>

          <div className={styles.railCard}>
            <div className={styles.railCardTitleRow}>
              <div>
                <p className={styles.railCardTitleBrand}>Agent가 이해한 요청</p>
                <p className={styles.railCardValue}>{UNDERSTOOD_WORK.title}</p>
              </div>
              <span className={styles.railCardMeta}>{UNDERSTOOD_WORK.note}</span>
            </div>
          </div>

          <h2 className={styles.panelTitle}>업무 건의 지금 할 일</h2>
          {WORKFLOW_TASKS.map((task) => (
            <div
              key={task.title}
              className={`${styles.taskCard} ${task.status === 'current' ? styles.taskCardCurrent : ''}`}
            >
              <div>
                <p className={styles.taskTitle}>{task.title}</p>
                <p className={styles.taskMeta}>{task.meta}</p>
              </div>
              <span className={`${styles.pill} ${styles[TASK_STATUS_TONE[task.status]]}`}>
                {task.statusLabel}
              </span>
            </div>
          ))}

          <p className={styles.footnote}>{COMPOUND_REQUEST_NOTE}</p>
          <button type="button" className={styles.railLink} onClick={() => setImportWizardOpen(true)}>
            파일로 근로자 명단 가져오기 →
          </button>
        </div>

        <div className={styles.railStack}>
          <div className={styles.railCard}>
            <p className={styles.railCardTitle}>대상 근로자 · 업무 건</p>
            <p className={styles.railCardValue}>{TARGET_CASE.workerName}</p>
            <p className={styles.railCardMeta}>{TARGET_CASE.meta}</p>
            <p className={styles.railCardMeta}>{TARGET_CASE.progress}</p>
          </div>

          <div className={styles.railCard}>
            <div className={styles.railCardTitleRow}>
              <p className={styles.railCardTitle}>필수정보 충족 현황</p>
              <span className={styles.railCardCount}>{REQUIRED_INFO_COUNT}</span>
            </div>
            {REQUIRED_INFO_ROWS.map((row) => (
              <div key={row.label} className={styles.infoRow}>
                <span className={styles.infoRowLabel}>{row.label}</span>
                <span className={styles.infoRowValueGroup}>
                  <span className={styles.infoRowValue}>{row.value}</span>
                  <span className={`${styles.pill} ${styles[INFO_SOURCE_TONE[row.sourceTone]]}`}>
                    {row.source}
                  </span>
                </span>
              </div>
            ))}
          </div>

          <div className={styles.railCardSubtle}>
            <p className={styles.railCardTitleBrand}>Agent가 준비하는 범위</p>
            <p className={styles.railCardMeta}>{AGENT_SCOPE_NOTE}</p>
          </div>
        </div>
      </div>

      <div className={styles.actionDock}>
        <div>
          <p className={styles.dockTitle}>{ACTION_DOCK.title}</p>
          <p className={styles.dockSubtitle}>{ACTION_DOCK.subtitle}</p>
        </div>
        <div className={styles.dockActions}>
          <Button variant="secondary" onClick={handleEditRequest}>
            원문 수정
          </Button>
          <Button onClick={handleAnalyze} isLoading={analyzing} disabled={originalRequest.trim() === ''}>
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
