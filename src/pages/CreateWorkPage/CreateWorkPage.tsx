import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { WorkflowStepIndicator } from '../../components/ui/WorkflowStepIndicator/WorkflowStepIndicator'
import { useToastStore } from '../../store/toastStore'
import { REVIEW_STEPS } from '../ReviewWorkPage/reviewWorkData'
import styles from './CreateWorkPage.module.css'
import { AGENT_TRACE_PREVIEW, EXAMPLE_PROMPTS, INPUT_MODES, MAX_LENGTH, type InputModeId } from './createWorkData'
import { ImportWizardModal } from './importWizard/ImportWizardModal'

export function CreateWorkPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // HOME-001 대시보드의 AI 요청 프롬프트 칩에서 넘어온 경우 선택한 문구를 미리 채워둔다.
  const prefill = (location.state as { prefill?: string } | null)?.prefill
  const [mode, setMode] = useState<InputModeId>('nl')
  const [request, setRequest] = useState(prefill ?? '')
  const [importWizardOpen, setImportWizardOpen] = useState(false)
  const showToast = useToastStore((state) => state.showToast)

  function handleExampleClick(example: string) {
    setRequest(example)
  }

  function handleAnalyze() {
    // TODO(backend): POST /api/work-items/analyze { mode, request } -> 분류·필수정보 확인 결과 반영
    navigate('/tasks/new/review')
  }

  function handleSaveDraft() {
    // TODO(backend): PATCH /api/work-items/draft -> 현재 입력 상태 저장
    showToast('초안을 저장했습니다.')
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
        <button type="button" className={styles.draftSave} onClick={handleSaveDraft}>
          임시 저장
        </button>
      </div>

      <WorkflowStepIndicator steps={REVIEW_STEPS} currentIndex={0} onStepClick={handleStepClick} />

      <h1 className={styles.headline}>무엇을 처리해야 하나요?</h1>
      <p className={styles.description}>한 문장으로 요청하거나 파일로 근로자 명단을 가져올 수 있습니다.</p>

      <div className={styles.modeGrid}>
        {INPUT_MODES.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`${styles.modeCard} ${mode === option.id ? styles.modeCardActive : ''}`}
            onClick={() => setMode(option.id)}
          >
            <p className={styles.modeTitle}>{option.label}</p>
            <p className={styles.modeDescription}>{option.description}</p>
          </button>
        ))}
      </div>

      {mode === 'file' ? (
        <div className={styles.textareaWrap}>
          <p className={styles.textareaHint}>
            Excel·PDF·이미지 파일로 근로자 명단을 한 번에 가져옵니다. 파일 확인 → 컬럼 매핑 →
            오류·충돌 검토 → 등록 결과 순서로 진행됩니다.
          </p>
          <button type="button" className={styles.fileImportButton} onClick={() => setImportWizardOpen(true)}>
            파일 선택하기 →
          </button>
        </div>
      ) : (
        <div className={styles.textareaWrap}>
          <textarea
            className={styles.textarea}
            maxLength={MAX_LENGTH}
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            placeholder="신규 베트남 근로자 3명의 입사서류와 4대보험 가입자료를 금요일까지 준비해야 합니다."
            aria-label="업무 요청 내용"
          />
          <p className={styles.textareaHint}>
            대상·기한·요청 내용을 자연스럽게 입력하세요. 부족한 정보만 다음 단계에서 확인합니다.
          </p>
          <span className={styles.charCount}>
            {request.length} / {MAX_LENGTH}
          </span>
        </div>
      )}

      <p className={styles.examplesLabel}>예시로 시작하기</p>
      <div className={styles.examples}>
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            type="button"
            className={styles.exampleChip}
            onClick={() => handleExampleClick(example)}
          >
            {example}
          </button>
        ))}
      </div>

      <div className={styles.tracePreview}>
        <p className={styles.traceTitle}>{AGENT_TRACE_PREVIEW.title}</p>
        <p className={styles.traceSteps}>{AGENT_TRACE_PREVIEW.steps}</p>
        <p className={styles.traceDisclaimer}>{AGENT_TRACE_PREVIEW.disclaimer}</p>
      </div>

      <div className={styles.actions}>
        <Link to="/tasks" className={styles.cancel}>
          취소
        </Link>
        <Button onClick={handleAnalyze} disabled={request.trim() === ''}>
          요청 분석하기 →
        </Button>
      </div>

      <p className={styles.footnote}>
        버튼·파일·정기 실행은 등록된 처리 절차로 직접 연결되며, 자연어 요청만 분류와 정보 확인을
        거칩니다.
      </p>

      <ImportWizardModal open={importWizardOpen} onClose={() => setImportWizardOpen(false)} />
    </div>
  )
}
