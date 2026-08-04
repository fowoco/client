import { useCallback, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../api/errors'
import { createTask, type TaskType } from '../../api/tasks'
import { fetchWorkers } from '../../api/workers'
import { fetchWorkflowCatalog } from '../../api/workflows'
import { Button } from '../../components/ui/Button/Button'
import { Dropdown } from '../../components/ui/Dropdown/Dropdown'
import { WorkflowStepIndicator } from '../../components/ui/WorkflowStepIndicator/WorkflowStepIndicator'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useToastStore } from '../../store/toastStore'
import { TASK_TYPE_LABEL } from '../../utils/taskStatus'
import { REVIEW_STEPS } from '../ReviewWorkPage/reviewWorkData'
import styles from './CreateWorkPage.module.css'
import {
  AGENT_TRACE_PREVIEW,
  EXAMPLE_PROMPTS,
  INPUT_MODES,
  MAX_LENGTH,
  type InputModeId,
} from './createWorkData'
import { ImportWizardModal } from './importWizard/ImportWizardModal'

const TASK_TYPE_OPTIONS = [
  { value: '', label: '업무 유형 선택' },
  ...(Object.keys(TASK_TYPE_LABEL) as TaskType[]).map((value) => ({
    value,
    label: TASK_TYPE_LABEL[value],
  })),
]

export function CreateWorkPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // HOME-001 대시보드의 AI 요청 프롬프트 칩에서 넘어온 경우 선택한 문구를 미리 채워둔다.
  const prefill = (location.state as { prefill?: string } | null)?.prefill
  const [mode, setMode] = useState<InputModeId>('nl')
  const [request, setRequest] = useState(prefill ?? '')
  const [importWizardOpen, setImportWizardOpen] = useState(false)
  const showToast = useToastStore((state) => state.showToast)

  // fowoco/server Task API에는 자연어 분석 엔드포인트가 없어(#153 조사 결과), 실제 생성은
  // 근로자·업무유형·workflow를 직접 고르는 구조화 폼으로 처리한다. 위 자연어 입력은
  // description으로 재활용한다.
  const { data: workerPage } = useApiQuery(useCallback(() => fetchWorkers({ size: 100 }), []))
  const { data: catalog } = useApiQuery(useCallback(() => fetchWorkflowCatalog(), []))

  const [workerId, setWorkerId] = useState('')
  const [taskType, setTaskType] = useState<TaskType | ''>('')
  const [workflowId, setWorkflowId] = useState('')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [slotValues, setSlotValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const workerOptions = useMemo(
    () => [
      { value: '', label: '근로자 선택' },
      ...(workerPage?.items ?? []).map((worker) => ({ value: worker.worker_id, label: worker.display_name })),
    ],
    [workerPage],
  )

  const availableWorkflows = useMemo(
    () => (catalog?.workflows ?? []).filter((workflow) => taskType && workflow.supported_task_types.includes(taskType)),
    [catalog, taskType],
  )
  const workflowOptions = useMemo(
    () => [
      { value: '', label: taskType ? 'Workflow 선택' : '업무 유형을 먼저 선택하세요' },
      ...availableWorkflows.map((workflow) => ({ value: workflow.workflow_id, label: workflow.name })),
    ],
    [availableWorkflows, taskType],
  )
  const selectedWorkflow = availableWorkflows.find((workflow) => workflow.workflow_id === workflowId)
  const canSubmit = workerId !== '' && taskType !== '' && workflowId !== '' && title.trim() !== '' && !submitting

  function handleTaskTypeChange(value: string) {
    setTaskType(value as TaskType | '')
    setWorkflowId('')
  }

  function handleSlotChange(slot: string, value: string) {
    setSlotValues((prev) => ({ ...prev, [slot]: value }))
  }

  async function handleCreateTask() {
    if (!canSubmit) return
    setSubmitting(true)
    setFormError(null)
    try {
      const businessData = Object.fromEntries(
        Object.entries(slotValues).filter(([, value]) => value.trim() !== ''),
      )
      const created = await createTask({
        worker_id: workerId,
        task_type: taskType as TaskType,
        workflow_id: workflowId,
        title: title.trim(),
        description: request.trim() || undefined,
        due_date: dueDate || undefined,
        business_data: businessData,
      })
      showToast('업무를 생성했습니다.')
      navigate(`/tasks/${created.task_id}`)
    } catch (error) {
      setFormError(error instanceof ApiError ? getErrorMessage(error) : '업무를 생성하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

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

  function handleLinkWorker() {
    // TODO(backend): GET /api/workers?q= -> 근로자 검색·연결 피커
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

      <WorkflowStepIndicator steps={REVIEW_STEPS} currentIndex={0} />

      <h1 className={styles.headline}>무엇을 처리해야 하나요?</h1>
      <p className={styles.description}>
        한 문장으로 요청하거나 파일·등록된 절차·이전 업무에서 시작할 수 있습니다.
      </p>

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

      <div className={styles.workspace}>
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

        <div className={styles.contextPanel}>
          <p className={styles.contextTitle}>Agent가 참고할 Context</p>

          <div className={styles.contextRow}>
            <span className={styles.contextLabel}>선택 근로자</span>
            <span className={`${styles.contextValue} ${styles.contextValueAccent}`}>
              없음 · 선택값
            </span>
          </div>
          <div className={styles.contextRow}>
            <span className={styles.contextLabel}>현재 화면</span>
            <span className={styles.contextValue}>업무함</span>
          </div>
          <div className={styles.contextRow}>
            <span className={styles.contextLabel}>첨부파일</span>
            <span className={styles.contextValue}>없음</span>
          </div>

          <button type="button" className={styles.linkWorker} onClick={handleLinkWorker}>
            ＋ 근로자 연결
          </button>
        </div>
      </div>

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

      <div className={styles.directCreateCard}>
        <h2 className={styles.directCreateTitle}>바로 업무 생성</h2>
        <p className={styles.directCreateHint}>
          Agent 분석 없이 근로자·업무 유형·처리 절차를 직접 골라 업무를 만듭니다. 위 요청 내용은
          설명으로 함께 저장됩니다.
        </p>

        <div className={styles.directCreateGrid}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>근로자</span>
            <Dropdown options={workerOptions} value={workerId} onChange={setWorkerId} ariaLabel="근로자 선택" />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>업무 유형</span>
            <Dropdown options={TASK_TYPE_OPTIONS} value={taskType} onChange={handleTaskTypeChange} ariaLabel="업무 유형 선택" />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>처리 절차</span>
            <Dropdown options={workflowOptions} value={workflowId} onChange={setWorkflowId} ariaLabel="Workflow 선택" />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="direct-create-title">
              제목
            </label>
            <input
              id="direct-create-title"
              className={styles.fieldInput}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="체류연장 준비"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="direct-create-due-date">
              마감일
            </label>
            <input
              id="direct-create-due-date"
              type="date"
              className={styles.fieldInput}
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
        </div>

        {selectedWorkflow && selectedWorkflow.required_slots.length > 0 && (
          <div className={styles.directCreateGrid}>
            {selectedWorkflow.required_slots.map((slot) => (
              <div key={slot} className={styles.field}>
                <label className={styles.fieldLabel} htmlFor={`direct-create-slot-${slot}`}>
                  {slot}
                </label>
                <input
                  id={`direct-create-slot-${slot}`}
                  className={styles.fieldInput}
                  value={slotValues[slot] ?? ''}
                  onChange={(event) => handleSlotChange(slot, event.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {formError && <p className={styles.fieldError}>{formError}</p>}

        <Button onClick={handleCreateTask} disabled={!canSubmit} isLoading={submitting}>
          업무 생성
        </Button>
      </div>

      <ImportWizardModal open={importWizardOpen} onClose={() => setImportWizardOpen(false)} />
    </div>
  )
}
