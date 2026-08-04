import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../api/errors'
import {
  createAiRun,
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
import styles from './ReviewWorkPage.module.css'
import { analysisOutcomeLabel, intentLabel, slotLabel } from './aiRunPresentation'

interface AiRunReviewProps {
  initialRun: AiRunResponse
  initialDraft?: WorkRequestDraft | null
}

function statusPresentation(run: AiRunResponse): { title: string; description: string; tone: StatusTone } {
  if (run.status === 'FAILED') {
    return {
      title: 'Agent가 요청을 완료하지 못했습니다.',
      description: '입력 내용은 유지됩니다. 같은 요청을 다시 분석하거나 내용을 수정해 주세요.',
      tone: 'critical',
    }
  }
  if (run.status === 'QUEUED' || run.status === 'RUNNING' || run.analysis_outcome === 'CONTEXT_REQUIRED') {
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
      description: '서로 독립된 업무 후보입니다. 실제로 만들 후보만 포함해 주세요.',
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
    Object.fromEntries(initialRun.questions.map((question) => [question.slot_key, question.answer ?? ''])),
  )
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(
    () => new Set(initialRun.candidates.map((candidate) => candidate.candidate_id)),
  )
  const [submitting, setSubmitting] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const presentation = statusPresentation(run)
  const hasCandidates = run.candidates.length > 0
  const candidateIds = useMemo(
    () => run.candidates.map((candidate) => candidate.candidate_id),
    [run.candidates],
  )

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
    () => new Map((catalog?.workflows ?? []).map((workflow) => [workflow.workflow_id, workflow.name])),
    [catalog],
  )
  const workerNames = useMemo(
    () => new Map((workerPage?.items ?? []).map((worker) => [worker.worker_id, worker.display_name])),
    [workerPage],
  )
  const selectedCount = selectedCandidateIds.size
  const editRequestState = {
    request: initialDraft?.request ?? run.instruction,
    mode: initialDraft?.mode ?? ('nl' as const),
    workerId: initialDraft?.workerId ?? '',
  }

  useEffect(() => {
    if (run.status !== 'QUEUED' && run.status !== 'RUNNING') return

    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const latest = await fetchAiRun(run.ai_run_id)
        if (!cancelled) setRun(latest)
      } catch (pollError) {
        if (!cancelled) {
          setError(pollError instanceof ApiError ? getErrorMessage(pollError) : '분석 상태를 확인하지 못했습니다.')
        }
      }
    }, 1200)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [run])

  useEffect(() => {
    setAnswers(Object.fromEntries(run.questions.map((question) => [question.slot_key, question.answer ?? ''])))
  }, [run.questions])

  useEffect(() => {
    setSelectedCandidateIds(new Set(candidateIds))
  }, [candidateIds])

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
        submitError instanceof ApiError ? getErrorMessage(submitError) : '추가 정보를 제출하지 못했습니다.',
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
      setError(retryError instanceof ApiError ? getErrorMessage(retryError) : '요청을 다시 분석하지 못했습니다.')
    } finally {
      setRetrying(false)
    }
  }

  function toggleCandidate(candidateId: string) {
    setSelectedCandidateIds((current) => {
      const next = new Set(current)
      if (next.has(candidateId)) next.delete(candidateId)
      else next.add(candidateId)
      return next
    })
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
        <li className={`${styles.stepItem} ${styles.stepItemDone}`}><span>✓</span>요청 입력</li>
        <li className={`${styles.stepItem} ${styles.stepItemDone}`}><span>✓</span>Agent 분석</li>
        <li className={`${styles.stepItem} ${run.analysis_outcome === 'NEEDS_INFO' ? styles.stepItemCurrent : styles.stepItemDone}`}>
          <span>{run.analysis_outcome === 'NEEDS_INFO' ? '3' : '✓'}</span>정보 확인
        </li>
        <li className={`${styles.stepItem} ${run.analysis_outcome === 'REVIEW_REQUIRED' ? styles.stepItemCurrent : ''}`}>
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
                  <label htmlFor={`ai-question-${question.slot_key}`} className={styles.missingQuestion}>
                    {question.label}{question.required ? ' *' : ''}
                  </label>
                  <input
                    id={`ai-question-${question.slot_key}`}
                    type={inputType(question)}
                    className={styles.questionInput}
                    value={answers[question.slot_key] ?? ''}
                    onChange={(event) =>
                      setAnswers((current) => ({ ...current, [question.slot_key]: event.target.value }))
                    }
                  />
                </div>
              ))}
              <p className={styles.missingWarning}>답변은 현재 분석 실행에 저장되며 새 분석 시도로 이어집니다.</p>
            </div>
          )}

          {run.status === 'FAILED' && (
            <div className={styles.errorCard} role="alert">
              <h2 className={styles.missingTitle}>분석을 계속할 수 없습니다</h2>
              <p className={styles.missingQuestion}>오류 코드: {run.error_code ?? 'UNKNOWN_ERROR'}</p>
              <p className={styles.emptyState}>업무는 생성되지 않았습니다. 원문은 그대로 유지됩니다.</p>
            </div>
          )}

          {error && <p className={styles.fieldError} role="alert">{error}</p>}
        </div>

        <aside className={styles.draftPanel}>
          <div className={styles.candidateHeader}>
            <div>
              <h2 className={styles.draftTitle}>Agent 업무 후보</h2>
              <p className={styles.draftBadge}>후보일 뿐 아직 실제 업무가 아닙니다</p>
            </div>
            {run.candidates.length > 1 && (
              <span className={styles.selectedCount}>{selectedCount}개 포함</span>
            )}
          </div>

          {run.candidates.length === 0 ? (
            <p className={styles.emptyState}>분석이 완료되고 필요한 정보가 채워지면 후보가 표시됩니다.</p>
          ) : (
            <div className={run.candidates.length > 1 ? styles.candidateGrid : undefined}>
              {run.candidates.map((candidate) => {
                const selected = selectedCandidateIds.has(candidate.candidate_id)
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
                        aria-label={`${workflowName ?? '업무 후보'} ${selected ? '제외' : '포함'}`}
                        onClick={() => toggleCandidate(candidate.candidate_id)}
                      >
                        {selected ? '✓' : ''}
                      </button>
                      <p className={styles.draftHeadline}>{workflowName ?? '처리 절차 이름 확인 필요'}</p>
                    </div>
                    <dl className={styles.candidateDetails}>
                      <div><dt>요청 유형</dt><dd>{intentLabel(run.detected_intent)}</dd></div>
                      <div><dt>대상</dt><dd>{workerName ?? (candidate.worker_id ? '근로자 이름 확인 중' : '대상 확인 필요')}</dd></div>
                      <div><dt>추천 처리 절차</dt><dd>{workflowName ?? '처리 절차 조회 필요'}</dd></div>
                      {Object.entries(candidate.extracted_slots).map(([key, value], index) => (
                        <div key={key}><dt>{slotLabel(key)}{slotLabel(key) === '추출 정보' ? ` ${index + 1}` : ''}</dt><dd>{value}</dd></div>
                      ))}
                      {candidate.missing_slots.length > 0 && (
                        <div><dt>누락 정보</dt><dd>{candidate.missing_slots.map(slotLabel).join(', ')}</dd></div>
                      )}
                    </dl>
                    <div className={styles.candidateActions}>
                      <Link to="/tasks/new" state={editRequestState} className={styles.cardLink}>내용 수정</Link>
                      <button type="button" className={styles.cardLink} onClick={() => toggleCandidate(candidate.candidate_id)}>
                        {selected ? '제외' : '다시 포함'}
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
        <Link to="/tasks/new" state={editRequestState} className={styles.editRequest}>요청 수정</Link>
        {run.analysis_outcome === 'NEEDS_INFO' ? (
          <Button onClick={handleSubmitAnswers} disabled={!canSubmitAnswers} isLoading={submitting}>
            답변하고 다시 분석
          </Button>
        ) : run.status === 'FAILED' ? (
          <Button onClick={handleRetry} isLoading={retrying}>같은 요청 다시 분석</Button>
        ) : (
          <Button disabled>
            선택한 {selectedCount}개 업무 생성
          </Button>
        )}
      </div>

      {run.analysis_outcome === 'REVIEW_REQUIRED' && (
        <p className={styles.blockedNotice} role="status">
          후보 확정 API가 아직 없어 업무 생성은 차단되어 있습니다. 선택 결과는 현재 화면에서만 검토할 수 있습니다.
        </p>
      )}
      <p className={styles.footnote}>분석 근거는 API가 실제 근거 데이터를 제공할 때만 표시합니다. 근거 없는 확률 점수는 사용하지 않습니다.</p>
    </div>
  )
}
