import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../api/errors'
import {
  decideAiRunCandidates,
  fetchAiRun,
  submitAiRunAnswers,
  type AiRunResponse,
  type AiRunQuestion,
} from '../../api/aiRuns'
import { Button } from '../../components/ui/Button/Button'
import { StatusLabel, type StatusTone } from '../../components/ui/StatusLabel/StatusLabel'
import styles from './ReviewWorkPage.module.css'

interface AiRunReviewProps {
  initialRun: AiRunResponse
}

function statusPresentation(run: AiRunResponse): {
  title: string
  description: string
  tone: StatusTone
} {
  if (run.status === 'FAILED') {
    return {
      title: 'Agent가 요청을 완료하지 못했습니다.',
      description: '잠시 후 다시 요청하거나 담당자에게 오류 코드를 알려 주세요.',
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
  return {
    title: `Agent가 요청을 ${run.candidates.length}개의 후보로 정리했습니다.`,
    description: '후보 내용을 검토해 실제 업무로 만들 항목을 선택합니다.',
    tone: 'success',
  }
}

function inputType(question: AiRunQuestion) {
  return question.input_type.toUpperCase() === 'DATE' ? 'date' : 'text'
}

export function AiRunReview({ initialRun }: AiRunReviewProps) {
  const navigate = useNavigate()
  const [run, setRun] = useState(initialRun)
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialRun.questions.map((question) => [question.slot_key, question.answer ?? '']),
    ),
  )
  const [submitting, setSubmitting] = useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(() => {
    const onlyCandidate = initialRun.candidates.length === 1 ? initialRun.candidates[0] : null
    return onlyCandidate?.missing_slots.length === 0 ? onlyCandidate.candidate_id : null
  })
  const [deciding, setDeciding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const decisionKeys = useRef(new Map<string, string>())
  const presentation = statusPresentation(run)

  useEffect(() => {
    if (run.status !== 'QUEUED' && run.status !== 'RUNNING') return

    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const latest = await fetchAiRun(run.ai_run_id)
        if (!cancelled) setRun(latest)
      } catch (pollError) {
        if (!cancelled) {
          setError(
            pollError instanceof ApiError
              ? getErrorMessage(pollError)
              : '분석 상태를 확인하지 못했습니다.',
          )
        }
      }
    }, 1200)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [run])

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
      onlyCandidate?.missing_slots.length === 0 ? onlyCandidate.candidate_id : null,
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

  function toggleCandidate(candidateId: string) {
    setSelectedCandidateId((current) => (current === candidateId ? null : candidateId))
  }

  async function handleDecideCandidates() {
    if (run.analysis_outcome !== 'REVIEW_REQUIRED' || !selectedCandidateId || deciding) return

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
        <Link to="/tasks/new" className={styles.back}>
          ← 요청 수정
        </Link>
        <span className={styles.runReference}>실행 {run.ai_run_id.slice(0, 8)}</span>
      </div>

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>{presentation.title}</h1>
          <p className={styles.description}>{presentation.description}</p>
        </div>
        <StatusLabel tone={presentation.tone}>
          {run.status === 'FAILED' ? '분석 실패' : (run.analysis_outcome ?? '분석 중')}
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
            <h2 className={styles.cardTitle}>전달한 요청</h2>
            <p className={styles.cardBadge}>사용자 발화 원문</p>
            <p className={styles.instruction}>{run.instruction}</p>
            <div className={styles.runMetadata}>
              <span>감지 Intent: {run.detected_intent ?? '분석 중'}</span>
              <span>시도 횟수: {run.attempt_count}</span>
            </div>
          </div>

          {run.analysis_outcome === 'NEEDS_INFO' && (
            <div className={styles.missingCard}>
              <h2 className={styles.missingTitle}>추가 정보가 필요합니다</h2>
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
                답변은 현재 AiRun에 저장되며 새 분석 시도로 이어집니다.
              </p>
            </div>
          )}

          {run.status === 'FAILED' && (
            <div className={styles.errorCard} role="alert">
              <h2 className={styles.missingTitle}>Runtime 호출을 확인해 주세요</h2>
              <p className={styles.missingQuestion}>
                오류 코드: {run.error_code ?? 'UNKNOWN_ERROR'}
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
          <h2 className={styles.draftTitle}>Agent 업무 후보</h2>
          {run.analysis_outcome === 'REVIEW_REQUIRED' && run.candidates.length > 1 && (
            <p className={styles.candidateGuide}>
              검토 후 실제 업무로 만들 후보 하나를 선택해 주세요.
            </p>
          )}
          {run.candidates.length === 0 ? (
            <p className={styles.emptyState}>추가 정보가 채워지면 업무 후보가 이곳에 표시됩니다.</p>
          ) : (
            run.candidates.map((candidate) => {
              const selected = selectedCandidateId === candidate.candidate_id
              const candidateReady = candidate.missing_slots.length === 0
              return (
                <div
                  key={candidate.candidate_id}
                  className={`${styles.candidateCard} ${selected ? styles.candidateCardSelected : ''}`}
                >
                  <p className={styles.draftBadge}>{candidate.candidate_ref}</p>
                  <p className={styles.draftHeadline}>{candidate.workflow_id}</p>
                  <p className={styles.candidateMeta}>
                    근로자: {candidate.worker_id ?? '확인 필요'}
                  </p>
                  {Object.entries(candidate.extracted_slots).map(([key, value]) => (
                    <p key={key} className={styles.candidateMeta}>
                      {key}: {value}
                    </p>
                  ))}
                  {!candidateReady && (
                    <p className={styles.candidateMissing}>
                      보완 필요: {candidate.missing_slots.join(', ')}
                    </p>
                  )}
                  {run.analysis_outcome === 'REVIEW_REQUIRED' && (
                    <div className={styles.candidateChoiceRow}>
                      <button
                        type="button"
                        className={styles.cardLink}
                        aria-label={`${candidate.candidate_ref} ${selected ? '선택 해제' : '이 후보 선택'}`}
                        aria-pressed={selected}
                        disabled={!candidateReady}
                        onClick={() => toggleCandidate(candidate.candidate_id)}
                      >
                        {candidateReady
                          ? selected
                            ? '선택 해제'
                            : '이 후보 선택'
                          : '정보 보완 필요'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </aside>
      </div>

      <div className={styles.actions}>
        <Link to="/tasks/new" className={styles.editRequest}>
          요청 수정
        </Link>
        {run.analysis_outcome === 'NEEDS_INFO' ? (
          <Button onClick={handleSubmitAnswers} disabled={!canSubmitAnswers} isLoading={submitting}>
            답변하고 다시 분석
          </Button>
        ) : run.analysis_outcome === 'REVIEW_REQUIRED' ? (
          <Button
            onClick={handleDecideCandidates}
            disabled={!selectedCandidateId}
            isLoading={deciding}
          >
            선택한 업무 생성
          </Button>
        ) : (
          <Button disabled>분석 완료 후 업무 생성</Button>
        )}
      </div>

      <p className={styles.footnote}>
        후보는 아직 실제 업무가 아닙니다. 선택한 후보를 확정하면 Case와 Task가 생성됩니다.
      </p>
    </div>
  )
}
