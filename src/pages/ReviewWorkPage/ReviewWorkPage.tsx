import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError, getErrorMessage } from '../../api/errors'
import { fetchAiRun, type AiRunResponse } from '../../api/aiRuns'
import { Button } from '../../components/ui/Button/Button'
import { DetailRow } from '../../components/ui/DetailRow/DetailRow'
import { Dropdown } from '../../components/ui/Dropdown/Dropdown'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useToastStore } from '../../store/toastStore'
import styles from './ReviewWorkPage.module.css'
import { AiRunReview } from './AiRunReview'
import {
  CURRENT_STEP_INDEX,
  DRAFT_REASONS,
  MISSING_INFO,
  PREPARED_CHECKLIST,
  PREPARED_DRAFT,
  REVIEW_STEPS,
  UNDERSTOOD_REQUEST,
} from './reviewWorkData'

const INSTITUTION_OPTIONS = [
  { value: '', label: MISSING_INFO.placeholder },
  ...MISSING_INFO.options.map((option) => ({ value: option, label: option })),
]

export function ReviewWorkPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [institution, setInstitution] = useState('')
  const navigationRun = (location.state as { aiRun?: AiRunResponse } | null)?.aiRun
  const aiRunId = new URLSearchParams(location.search).get('aiRunId')
  const [recoveredRun, setRecoveredRun] = useState<AiRunResponse | null>(null)
  const [recovering, setRecovering] = useState(Boolean(aiRunId && !navigationRun))
  const [recoveryError, setRecoveryError] = useState<string | null>(null)
  const canCreate = institution !== ''
  const showToast = useToastStore((state) => state.showToast)
  const aiRun = navigationRun ?? recoveredRun

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
    return <AiRunReview initialRun={aiRun} />
  }

  if (recovering || recoveryError) {
    return (
      <div>
        <div className={styles.topBar}>
          <Link to="/tasks/new" className={styles.back}>← 요청 수정</Link>
        </div>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.headline}>
              {recovering ? 'Agent 분석 결과를 불러오고 있습니다.' : 'Agent 분석 결과를 불러오지 못했습니다.'}
            </h1>
            <p className={styles.description} role={recoveryError ? 'alert' : undefined}>
              {recoveryError ?? '저장된 실행 번호로 최신 상태를 확인합니다.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  function handleCreate() {
    // TODO(backend): POST /api/work-items { ...UNDERSTOOD_REQUEST, institution } -> 생성 후 WORK-001로 이동
    navigate('/tasks')
  }

  function handleSaveDraft() {
    // TODO(backend): PATCH /api/work-items/draft -> 현재 입력 상태 저장
    showToast('초안을 저장했습니다.')
  }

  function handleViewOriginal() {
    // TODO(backend): GET /api/work-items/draft/original -> 원문 텍스트 표시
  }

  function handleViewEvidence() {
    // TODO(backend): GET /api/work-items/draft/evidence -> 분석 근거 표시
    showToast('분석 근거 보기는 준비 중입니다.')
  }

  function handleEditDraft() {
    // TODO(backend): PATCH /api/work-items/draft/content -> 초안 내용 직접 수정
  }

  function handlePreviewChecklist() {
    // TODO(backend): GET /api/procedures/:id/checklist -> 체크리스트 미리보기
  }

  return (
    <div>
      <div className={styles.topBar}>
        <Link to="/tasks/new" className={styles.back}>
          ← 업무 생성
        </Link>
        <button type="button" className={styles.draftSave} onClick={handleSaveDraft}>
          초안 저장
        </button>
      </div>

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>Agent가 요청을 1개의 업무로 정리했습니다.</h1>
          <p className={styles.description}>
            확인이 필요한 정보 1개를 입력하면 실행 가능한 업무 초안이 완성됩니다.
          </p>
        </div>
        <StatusLabel tone="warning">확인 필요 · 1</StatusLabel>
      </div>

      <ol className={styles.stepIndicator}>
        {REVIEW_STEPS.map((step, index) => (
          <li
            key={step.no}
            className={`${styles.stepItem} ${index <= CURRENT_STEP_INDEX ? styles.stepItemDone : ''} ${
              index === CURRENT_STEP_INDEX ? styles.stepItemCurrent : ''
            }`}
          >
            <span aria-hidden="true">{index < CURRENT_STEP_INDEX ? '✓' : step.no}</span>
            {step.label}
            {index < REVIEW_STEPS.length - 1 && <span className={styles.stepArrow} aria-hidden="true">→</span>}
          </li>
        ))}
      </ol>

      <div className={styles.workspace}>
        <div className={styles.left}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Agent가 이해한 요청</h2>
            <p className={styles.cardBadge}>Agent 초안 · 원문과 현재 Context 기반</p>

            <div className={styles.fieldGrid}>
              <div>
                <p className={styles.fieldLabel}>요청 목적</p>
                <p className={styles.fieldValue}>{UNDERSTOOD_REQUEST.purpose}</p>
              </div>
              <div>
                <p className={styles.fieldLabel}>업무 영역</p>
                <p className={styles.fieldValue}>{UNDERSTOOD_REQUEST.domain}</p>
              </div>
              <div>
                <p className={styles.fieldLabel}>추천 처리 절차</p>
                <p className={styles.fieldValue}>{UNDERSTOOD_REQUEST.procedure}</p>
              </div>
            </div>

            <div className={styles.fieldGridTwo}>
              <div>
                <p className={styles.fieldLabel}>대상</p>
                <p className={styles.fieldValue}>{UNDERSTOOD_REQUEST.target}</p>
              </div>
              <div>
                <p className={styles.fieldLabel}>마감일</p>
                <p className={styles.fieldValue}>{UNDERSTOOD_REQUEST.dueDate}</p>
              </div>
            </div>

            <div className={styles.cardLinks}>
              <button type="button" className={styles.cardLink} onClick={handleViewOriginal}>
                원문 보기 ▾
              </button>
              <button type="button" className={styles.cardLink} onClick={handleViewEvidence}>
                근거 보기 ▾
              </button>
            </div>
          </div>

          <div className={styles.missingCard}>
            <h2 className={styles.missingTitle}>{MISSING_INFO.title}</h2>
            <p className={styles.missingQuestion}>{MISSING_INFO.question}</p>
            <Dropdown
              options={INSTITUTION_OPTIONS}
              value={institution}
              onChange={setInstitution}
              ariaLabel={MISSING_INFO.placeholder}
            />
            <p className={styles.missingWarning}>{MISSING_INFO.warning}</p>
          </div>
        </div>

        <aside className={styles.draftPanel}>
          <h2 className={styles.draftTitle}>준비한 업무 초안</h2>
          <p className={styles.draftBadge}>Agent가 준비함 · HR 확인 필요</p>
          <p className={styles.draftHeadline}>
            {PREPARED_DRAFT.title.map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
          </p>

          <div className={styles.checklist}>
            <p className={styles.checklistTitle}>Agent가 확인하고 준비한 내용</p>
            {PREPARED_CHECKLIST.map((item) => (
              <p key={item} className={styles.checklistItem}>
                <span aria-hidden="true">✓</span> {item}
              </p>
            ))}
          </div>

          {PREPARED_DRAFT.rows.map((row) => (
            <DetailRow key={row.label} label={row.label} value={row.value} />
          ))}

          <div className={styles.reasonBox}>
            <p className={styles.reasonTitle}>이 초안을 준비한 이유</p>
            {DRAFT_REASONS.map((reason) => (
              <p key={reason} className={styles.reasonItem}>
                · {reason}
              </p>
            ))}
          </div>

          <button type="button" className={styles.draftLink} onClick={handleEditDraft}>
            초안 내용 수정
          </button>
          <button type="button" className={styles.draftLink} onClick={handlePreviewChecklist}>
            체크리스트 미리보기 ▾
          </button>
        </aside>
      </div>

      <div className={styles.actions}>
        <Link to="/tasks/new" className={styles.editRequest}>
          요청 수정
        </Link>
        <Button onClick={handleCreate} disabled={!canCreate}>
          정보 확인 후 업무 생성
        </Button>
      </div>

      <p className={styles.footnote}>
        분석 근거는 근거 보기를 눌렀을 때만 표시됩니다. 근거 없는 확률 점수는 사용하지 않습니다.
      </p>
    </div>
  )
}
