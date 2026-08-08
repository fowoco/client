import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../api/errors'
import { subscribeAiRunEvents, type AiRunPublicEvent } from '../../api/aiRunEvents'
import {
  createAiRun,
  decideAiRunCandidates,
  fetchAiRun,
  submitAiRunAnswers,
  type AiRunQuestion,
  type AiRunResponse,
} from '../../api/aiRuns'
import { fetchWorkers } from '../../api/workers'
import { fetchWorkflowCatalog } from '../../api/workflows'
import { Button } from '../../components/ui/Button/Button'
import { StatusLabel, type StatusTone } from '../../components/ui/StatusLabel/StatusLabel'
import { useApiQuery } from '../../hooks/useApiQuery'
import {
  saveActiveWorkRequestDraft,
  saveAiRunWorkRequestDraft,
  type WorkRequestDraft,
} from '../CreateWorkPage/workRequestDraft'
import styles from './AiRunReview.module.css'
import { analysisOutcomeLabel, intentLabel, slotLabel } from './aiRunPresentation'

interface AiRunReviewProps {
  initialRun: AiRunResponse
  initialDraft?: WorkRequestDraft | null
}

function statusPresentation(run: AiRunResponse): {
  title: string
  description: string
  tone: StatusTone
} {
  if (run.status === 'FAILED') {
    return {
      title: 'Agent가 요청을 완료하지 못했습니다.',
      description: '입력 내용은 유지됩니다. 같은 요청을 다시 분석하거나 내용을 수정해 주세요.',
      tone: 'critical',
    }
  }
  if (
    run.status === 'QUEUED' ||
    run.status === 'RUNNING' ||
    run.analysis_outcome === 'CONTEXT_REQUIRED'
  ) {
    return {
      title: 'Agent가 요청을 분석하고 있습니다.',
      description: '등록된 근로자 정보와 처리 절차를 확인하고 있습니다.',
      tone: 'agent',
    }
  }
  if (run.analysis_outcome === 'NEEDS_INFO') {
    return {
      title: `Agent가 확인할 정보 ${run.questions.length}개를 찾았습니다.`,
      description: '아래 질문에 답하면 같은 요청을 이어서 분석합니다.',
      tone: 'warning',
    }
  }
  if (run.candidates.length > 1) {
    return {
      title: `${run.candidates.length}개의 업무를 찾았습니다.`,
      description: '후보를 비교한 뒤 이번에 실제 업무로 만들 하나를 선택해 주세요.',
      tone: 'warning',
    }
  }
  return {
    title: 'Agent가 업무 후보를 준비했습니다.',
    description: '원문과 추출 정보를 확인하고 실제 업무로 만들 후보를 검토해 주세요.',
    tone: 'success',
  }
}

function inputType(question: AiRunQuestion) {
  return question.input_type.toUpperCase() === 'DATE' ? 'date' : 'text'
}

export function AiRunReview({ initialRun, initialDraft }: AiRunReviewProps) {
  const navigate = useNavigate()
  const [run, setRun] = useState(initialRun)
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialRun.questions.map((question) => [question.slot_key, question.answer ?? '']),
    ),
  )
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(() =>
    initialRun.candidates.length === 1 && initialRun.candidates[0].missing_slots.length === 0
      ? initialRun.candidates[0].candidate_id
      : null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [deciding, setDeciding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const decisionKeys = useRef(new Map<string, string>())
  const presentation = statusPresentation(run)
  const hasCandidates = run.candidates.length > 0

  const catalogFetcher = useCallback(() => {
    if (!hasCandidates) {
      return Promise.resolve({
        bundle_id: '',
        bundle_version: '',
        bundle_status: '',
        source_repository: '',
        generated_at: '',
        workflows: [],
      })
    }
    return fetchWorkflowCatalog()
  }, [hasCandidates])
  const workerFetcher = useCallback(() => {
    if (!hasCandidates) {
      return Promise.resolve({ items: [], page: 0, size: 100, total_elements: 0 })
    }
    return fetchWorkers({ size: 100 })
  }, [hasCandidates])
  const { data: catalog } = useApiQuery(catalogFetcher)
  const { data: workerPage } = useApiQuery(workerFetcher)

  const workflowNames = useMemo(
    () =>
      new Map((catalog?.workflows ?? []).map((workflow) => [workflow.workflow_id, workflow.name])),
    [catalog],
  )
  const workerNames = useMemo(
    () =>
      new Map((workerPage?.items ?? []).map((worker) => [worker.worker_id, worker.display_name])),
    [workerPage],
  )
  const selectedCount = selectedCandidateId ? 1 : 0
  const editRequestState = {
    request: initialDraft?.request ?? run.instruction,
    mode: initialDraft?.mode ?? ('nl' as const),
    workerId: initialDraft?.workerId ?? '',
  }

  const isProcessing = run.status === 'QUEUED' || run.status === 'RUNNING'

  useEffect(() => {
    if (!isProcessing) return

    let cancelled = false
    let pollingTimer: number | null = null
    let terminalEventSeen = false
    const controller = new AbortController()

    const updateFromFullRun = async () => {
      try {
        const latest = await fetchAiRun(run.ai_run_id)
        if (!cancelled) {
          setRun(latest)
          setError(null)
        }
        return latest
      } catch (pollError) {
        if (!cancelled) {
          setError(
            pollError instanceof ApiError
              ? getErrorMessage(pollError)
              : '분석 상태를 확인하지 못했습니다.',
          )
        }
        return null
      }
    }

    const schedulePolling = () => {
      if (cancelled || pollingTimer !== null) return
      pollingTimer = window.setTimeout(async () => {
        pollingTimer = null
        const latest = await updateFromFullRun()
        if (!latest || latest.status === 'QUEUED' || latest.status === 'RUNNING') {
          schedulePolling()
        }
      }, 1200)
    }

    const handleEvent = (event: AiRunPublicEvent) => {
      if (event.ai_run_id !== run.ai_run_id || cancelled) return
      const terminal =
        event.type === 'NEEDS_INFO' ||
        event.type === 'REVIEW_REQUIRED' ||
        event.type === 'COMPLETED' ||
        event.type === 'FAILED'
      if (terminal) {
        terminalEventSeen = true
        void updateFromFullRun().then((latest) => {
          if (!latest) schedulePolling()
        })
        return
      }
      setRun((current) =>
        current.version > event.version
          ? current
          : {
              ...current,
              status: event.status,
              analysis_outcome: event.analysis_outcome,
              attempt_count: event.attempt_count,
              version: event.version,
              updated_at: event.occurred_at,
            },
      )
    }

    subscribeAiRunEvents(run.ai_run_id, {
      signal: controller.signal,
      onEvent: handleEvent,
    })
      .then(() => {
        if (!terminalEventSeen) schedulePolling()
      })
      .catch(() => {
        if (!cancelled && !controller.signal.aborted) schedulePolling()
      })

    return () => {
      cancelled = true
      controller.abort()
      if (pollingTimer !== null) window.clearTimeout(pollingTimer)
    }
  }, [isProcessing, run.ai_run_id])

  useEffect(() => {
    setAnswers(
      Object.fromEntries(
        run.questions.map((question) => [question.slot_key, question.answer ?? '']),
      ),
    )
  }, [run.questions])

  useEffect(() => {
    const onlyCandidate = run.candidates.length === 1 ? run.candidates[0] : null
    setSelectedCandidateId(
      onlyCandidate && onlyCandidate.missing_slots.length === 0 ? onlyCandidate.candidate_id : null,
    )
  }, [run.candidates])

  const canSubmitAnswers = useMemo(
    () =>
      run.analysis_outcome === 'NEEDS_INFO' &&
      run.questions.every((question) => !question.required || answers[question.slot_key]?.trim()),
    [answers, run.analysis_outcome, run.questions],
  )

  async function handleSubmitAnswers() {
    if (!canSubmitAnswers || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const submittedAnswers = Object.fromEntries(
        Object.entries(answers).filter(([, value]) => value.trim() !== ''),
      )
      setRun(await submitAiRunAnswers(run.ai_run_id, run.version, submittedAnswers))
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? getErrorMessage(submitError)
          : '추가 정보를 제출하지 못했습니다.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRetry() {
    if (retrying) return
    setRetrying(true)
    setError(null)
    try {
      const retriedRun = await createAiRun(run.instruction, globalThis.crypto.randomUUID())
      const draft: WorkRequestDraft = initialDraft ?? {
        request: run.instruction,
        mode: 'nl',
        workerId: '',
        attachments: [],
      }
      saveActiveWorkRequestDraft(draft)
      saveAiRunWorkRequestDraft(retriedRun.ai_run_id, draft)
      navigate(`/tasks/new/review?aiRunId=${encodeURIComponent(retriedRun.ai_run_id)}`, {
        replace: true,
        state: { aiRun: retriedRun, draft },
      })
      setRun(retriedRun)
    } catch (retryError) {
      setError(
        retryError instanceof ApiError
          ? getErrorMessage(retryError)
          : '요청을 다시 분석하지 못했습니다.',
      )
    } finally {
      setRetrying(false)
    }
  }

  function toggleCandidate(candidateId: string) {
    setSelectedCandidateId((current) => (current === candidateId ? null : candidateId))
  }

  async function handleDecideCandidates() {
    if (deciding || run.analysis_outcome !== 'REVIEW_REQUIRED' || !selectedCandidateId) return

    const selectedCandidate = run.candidates.find(
      (candidate) => candidate.candidate_id === selectedCandidateId,
    )
    if (!selectedCandidate || selectedCandidate.missing_slots.length > 0) return

    setDeciding(true)
    setError(null)
    try {
      let idempotencyKey = decisionKeys.current.get(selectedCandidateId)
      if (!idempotencyKey) {
        idempotencyKey = globalThis.crypto.randomUUID()
        decisionKeys.current.set(selectedCandidateId, idempotencyKey)
      }
      const result = await decideAiRunCandidates(
        run.ai_run_id,
        run.version,
        run.candidates.map((candidate) => ({
          candidate_id: candidate.candidate_id,
          action: candidate.candidate_id === selectedCandidateId ? 'ACCEPT' : 'DISCARD',
        })),
        idempotencyKey,
      )
      const firstTaskId = result.task_ids[0]
      navigate(firstTaskId ? `/tasks/${encodeURIComponent(firstTaskId)}` : '/tasks', {
        replace: true,
        state: { createdTaskIds: result.task_ids, caseId: result.case_id },
      })
    } catch (decisionError) {
      setError(
        decisionError instanceof ApiError
          ? getErrorMessage(decisionError)
          : '업무 후보를 확정하지 못했습니다.',
      )
    } finally {
      setDeciding(false)
    }
  }

  return (
    <div>
      <div className={styles.topBar}>
        <Link to="/tasks/new" state={editRequestState} className={styles.back}>
          ← 요청 수정
        </Link>
        <span className={styles.runReference}>분석 실행 {run.ai_run_id.slice(0, 8)}</span>
      </div>

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>{presentation.title}</h1>
          <p className={styles.description}>{presentation.description}</p>
        </div>
        <StatusLabel tone={presentation.tone}>
          {run.status === 'FAILED' ? '분석 실패' : analysisOutcomeLabel(run.analysis_outcome)}
        </StatusLabel>
      </div>

      <ol className={styles.stepIndicator}>
        <li className={`${styles.stepItem} ${styles.stepItemDone}`}>
          <span>✓</span>요청 입력
        </li>
        <li className={`${styles.stepItem} ${styles.stepItemDone}`}>
          <span>✓</span>Agent 분석
        </li>
        <li
          className={`${styles.stepItem} ${run.analysis_outcome === 'NEEDS_INFO' ? styles.stepItemCurrent : styles.stepItemDone}`}
        >
          <span>{run.analysis_outcome === 'NEEDS_INFO' ? '3' : '✓'}</span>정보 확인
        </li>
        <li
          className={`${styles.stepItem} ${run.analysis_outcome === 'REVIEW_REQUIRED' ? styles.stepItemCurrent : ''}`}
        >
          <span>4</span>후보 검토
        </li>
      </ol>

      <div className={styles.workspace}>
        <div className={styles.left}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Agent가 확인한 요청</h2>
            <p className={styles.cardBadge}>사용자가 입력한 원문</p>
            <p className={styles.instruction}>{run.instruction}</p>
            <div className={styles.fieldGridTwo}>
              <div>
                <p className={styles.fieldLabel}>요청 유형</p>
                <p className={styles.fieldValue}>{intentLabel(run.detected_intent)}</p>
              </div>
              <div>
                <p className={styles.fieldLabel}>분석 근거</p>
                <p className={styles.fieldValue}>현재 분석 API에서 제공하지 않음</p>
              </div>
            </div>
          </div>

          {run.analysis_outcome === 'NEEDS_INFO' && (
            <div className={styles.missingCard}>
              <h2 className={styles.missingTitle}>HR이 확인할 정보 {run.questions.length}개</h2>
              {run.questions.map((question) => (
                <div key={question.slot_key} className={styles.questionField}>
                  <label
                    htmlFor={`ai-question-${question.slot_key}`}
                    className={styles.missingQuestion}
                  >
                    {question.label}
                    {question.required ? ' *' : ''}
                  </label>
                  <input
                    id={`ai-question-${question.slot_key}`}
                    type={inputType(question)}
                    className={styles.questionInput}
                    value={answers[question.slot_key] ?? ''}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.slot_key]: event.target.value,
                      }))
                    }
                  />
                </div>
              ))}
              <p className={styles.missingWarning}>
                답변은 현재 분석 실행에 저장되며 새 분석 시도로 이어집니다.
              </p>
            </div>
          )}

          {run.status === 'FAILED' && (
            <div className={styles.errorCard} role="alert">
              <h2 className={styles.missingTitle}>분석을 계속할 수 없습니다</h2>
              <p className={styles.missingQuestion}>
                오류 코드: {run.error_code ?? 'UNKNOWN_ERROR'}
              </p>
              <p className={styles.emptyState}>
                업무는 생성되지 않았습니다. 원문은 그대로 유지됩니다.
              </p>
            </div>
          )}

          {error && (
            <p className={styles.fieldError} role="alert">
              {error}
            </p>
          )}
        </div>

        <aside className={styles.draftPanel}>
          <div className={styles.candidateHeader}>
            <div>
              <h2 className={styles.draftTitle}>Agent 업무 후보</h2>
              <p className={styles.draftBadge}>후보일 뿐 아직 실제 업무가 아닙니다</p>
            </div>
            {run.candidates.length > 1 && (
              <span className={styles.selectedCount}>
                {selectedCandidateId ? '1개 선택' : '선택 필요'}
              </span>
            )}
          </div>

          {run.candidates.length === 0 ? (
            <p className={styles.emptyState}>
              분석이 완료되고 필요한 정보가 채워지면 후보가 표시됩니다.
            </p>
          ) : (
            <div className={run.candidates.length > 1 ? styles.candidateGrid : undefined}>
              {run.candidates.map((candidate) => {
                const selected = selectedCandidateId === candidate.candidate_id
                const candidateReady = candidate.missing_slots.length === 0
                const workflowName = workflowNames.get(candidate.workflow_id)
                const workerName = candidate.worker_id ? workerNames.get(candidate.worker_id) : null
                return (
                  <section
                    key={candidate.candidate_id}
                    className={`${styles.candidateCard} ${selected ? styles.candidateCardSelected : styles.candidateCardExcluded}`}
                  >
                    <div className={styles.candidateTitleRow}>
                      <button
                        type="button"
                        className={styles.candidateCheck}
                        aria-pressed={selected}
                        aria-label={`${workflowName ?? '업무 후보'} ${selected ? '선택 해제' : '선택'}`}
                        disabled={!candidateReady || deciding}
                        onClick={() => toggleCandidate(candidate.candidate_id)}
                      >
                        {selected ? '✓' : ''}
                      </button>
                      <p className={styles.draftHeadline}>
                        {workflowName ?? '처리 절차 이름 확인 필요'}
                      </p>
                    </div>
                    <dl className={styles.candidateDetails}>
                      <div>
                        <dt>요청 유형</dt>
                        <dd>{intentLabel(run.detected_intent)}</dd>
                      </div>
                      <div>
                        <dt>대상</dt>
                        <dd>
                          {workerName ??
                            (candidate.worker_id ? '근로자 이름 확인 중' : '대상 확인 필요')}
                        </dd>
                      </div>
                      <div>
                        <dt>추천 처리 절차</dt>
                        <dd>{workflowName ?? '처리 절차 조회 필요'}</dd>
                      </div>
                      {Object.entries(candidate.extracted_slots).map(([key, value], index) => (
                        <div key={key}>
                          <dt>
                            {slotLabel(key)}
                            {slotLabel(key) === '추출 정보' ? ` ${index + 1}` : ''}
                          </dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                      {candidate.missing_slots.length > 0 && (
                        <div>
                          <dt>누락 정보</dt>
                          <dd>{candidate.missing_slots.map(slotLabel).join(', ')}</dd>
                        </div>
                      )}
                    </dl>
                    <div className={styles.candidateActions}>
                      <Link to="/tasks/new" state={editRequestState} className={styles.cardLink}>
                        내용 수정
                      </Link>
                      <button
                        type="button"
                        className={styles.cardLink}
                        disabled={!candidateReady || deciding}
                        onClick={() => toggleCandidate(candidate.candidate_id)}
                      >
                        {candidateReady
                          ? selected
                            ? '선택 해제'
                            : '이 후보 선택'
                          : '정보 보완 필요'}
                      </button>
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </aside>
      </div>

      <div className={styles.actions}>
        <Link to="/tasks/new" state={editRequestState} className={styles.editRequest}>
          요청 수정
        </Link>
        {run.analysis_outcome === 'NEEDS_INFO' ? (
          <Button onClick={handleSubmitAnswers} disabled={!canSubmitAnswers} isLoading={submitting}>
            답변하고 다시 분석
          </Button>
        ) : run.status === 'FAILED' ? (
          <Button onClick={handleRetry} isLoading={retrying}>
            같은 요청 다시 분석
          </Button>
        ) : (
          <Button
            disabled={run.analysis_outcome !== 'REVIEW_REQUIRED' || selectedCount === 0}
            isLoading={deciding}
            onClick={handleDecideCandidates}
          >
            선택한 업무 생성
          </Button>
        )}
      </div>

      {run.analysis_outcome === 'REVIEW_REQUIRED' && run.candidates.length > 1 && (
        <p className={styles.blockedNotice} role="status">
          한 번에 하나의 후보만 실제 업무로 만들 수 있습니다. 나머지 후보는 이번 결정에서
          제외됩니다.
        </p>
      )}
      <p className={styles.footnote}>
        분석 근거는 API가 실제 근거 데이터를 제공할 때만 표시합니다. 근거 없는 확률 점수는 사용하지
        않습니다.
      </p>
    </div>
  )
}
