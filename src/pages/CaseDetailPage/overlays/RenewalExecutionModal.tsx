import { useState } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import { StatusLabel } from '../../../components/ui/StatusLabel/StatusLabel'
import { ApiError, getErrorMessage } from '../../../api/errors'
import { runRenewalExecution, type RenewalExecutionResponse } from '../../../api/renewal'
import { TASK_STATUS_LABEL, TASK_STATUS_TONE } from '../../../utils/taskStatus'
import { getWorkerGuideReviewPresentation } from '../../../view-models/workerGuideReviewViewModel'
import styles from './overlays.module.css'

const SLOT_PRESENTATION: Record<
  string,
  { label: string; placeholder: string; type?: 'text' | 'number' | 'date' | 'datetime-local' }
> = {
  due_at: {
    label: '처리 기한',
    placeholder: '날짜와 시간을 선택해 주세요',
    type: 'datetime-local',
  },
  wage: { label: '월 임금(원)', placeholder: '예: 2500000', type: 'number' },
  working_hours: { label: '주당 근로시간', placeholder: '예: 40', type: 'number' },
  job_description: { label: '담당 업무', placeholder: '예: 제조·조립 업무' },
  work_location: { label: '근무 장소', placeholder: '예: 수원 제1공장' },
  lodging: { label: '숙소 조건', placeholder: '예: 회사 기숙사 제공' },
  contract_period: { label: '계약 기간', placeholder: '예: 2026-09-01~2027-08-31' },
  contract_start_date: { label: '계약 시작일', placeholder: '계약 시작일', type: 'date' },
  contract_end_date: { label: '계약 종료일', placeholder: '계약 종료일', type: 'date' },
}

function slotPresentation(key: string) {
  return (
    SLOT_PRESENTATION[key] ?? {
      label: key,
      placeholder: `${key} 값을 입력해 주세요`,
      type: 'text' as const,
    }
  )
}

export interface RenewalExecutionModalProps {
  open: boolean
  taskId: string
  taskVersion: number
  onClose: () => void
  onDownloadDocument: (fileId: string, fallbackName: string) => void
  onApplied: (result: RenewalExecutionResponse) => void
}

export function RenewalExecutionModal({
  open,
  taskId,
  taskVersion,
  onClose,
  onDownloadDocument,
  onApplied,
}: RenewalExecutionModalProps) {
  const [instruction, setInstruction] = useState('')
  const [slotAnswers, setSlotAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<RenewalExecutionResponse | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    setInstruction('')
    setSlotAnswers({})
    setResult(null)
    setError(null)
    onClose()
  }

  async function handleRun() {
    const text = instruction.trim()
    if (text === '' || running) return

    setRunning(true)
    setError(null)
    try {
      const response = await runRenewalExecution(taskId, {
        instruction: text,
        expected_version: result?.task_version ?? taskVersion,
      })
      setResult(response)
      setSlotAnswers({})
      onApplied(response)
    } catch (caught) {
      setError(
        caught instanceof ApiError ? getErrorMessage(caught) : 'Renewal 실행에 실패했습니다.',
      )
    } finally {
      setRunning(false)
    }
  }

  async function handleSubmitAnswers() {
    if (!result || running) return
    const answers = Object.fromEntries(
      Object.entries(slotAnswers).filter(([, value]) => value.trim() !== ''),
    )
    if (Object.keys(answers).length === 0) return

    setRunning(true)
    setError(null)
    try {
      const response = await runRenewalExecution(taskId, {
        instruction: instruction.trim(),
        expected_version: result.task_version,
        slot_answers: answers,
      })
      setResult(response)
      setSlotAnswers({})
      onApplied(response)
    } catch (caught) {
      setError(
        caught instanceof ApiError ? getErrorMessage(caught) : 'Renewal 실행에 실패했습니다.',
      )
    } finally {
      setRunning(false)
    }
  }

  const answerableFields =
    result?.requested_fields.filter((field) => field.source_hint === 'USER_INPUT') ?? []
  const nonAnswerableMissingSlots =
    result?.missing_slots.filter((slot) => !answerableFields.some((field) => field.key === slot)) ??
    []
  const resultStatusLabel = result?.guide_review_required
    ? '안내문 검토 필요'
    : result?.task_status === 'NEEDS_INFO' && result.missing_slots.length === 0
      ? '체크리스트 확인 필요'
      : result
        ? TASK_STATUS_LABEL[result.task_status]
        : ''
  const guideReview = result?.guide_review_required
    ? getWorkerGuideReviewPresentation(result.guide_failure_code)
    : null

  return (
    <Modal open={open} onClose={handleClose} title="Renewal Agent 실행" size="wide">
      <p className={styles.description}>
        재계약·연장 처리를 자연어로 요청하면 Agent가 필요정보를 확인하고 문서를 준비합니다. 자동
        승인·발송은 하지 않습니다.
      </p>

      {!result && (
        <div className={styles.field}>
          <p className={styles.fieldLabel}>요청 내용</p>
          <textarea
            className={styles.reasonTextarea}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="예: 응웬반A 체류기간 연장 준비해줘"
            rows={4}
            maxLength={10000}
            disabled={running}
          />
        </div>
      )}

      {result && (
        <>
          <div className={styles.plainRow}>
            <span className={styles.plainValue}>{result.outcome}</span>
            <StatusLabel tone={TASK_STATUS_TONE[result.task_status]}>
              {resultStatusLabel}
            </StatusLabel>
          </div>

          {result.scenario === 'ask_worker' && result.worker_message_draft_id && (
            <div className={styles.policyBanner}>
              <p className={styles.policyBannerText}>
                근로자에게 보낼 안내 초안을 저장했습니다 — 문서함에서 확인 후 링크로 전달해 주세요.
              </p>
            </div>
          )}

          {guideReview && (
            <div className={styles.policyBanner} role="alert">
              <p className={styles.policyBannerTitle}>{guideReview.title}</p>
              <p className={styles.policyBannerText}>
                {guideReview.description} 안내 초안과 발송 링크는 생성되지 않았습니다.
              </p>
              <p className={styles.plainValue}>
                창을 닫은 뒤 문서 확인 영역에서 대상 언어와 안내문을 검토·저장하고 승인해 주세요.
              </p>
              {result.guide_review_draft?.translated_text && (
                <p className={styles.plainValue}>
                  검토할 번역 초안: {result.guide_review_draft.translated_text}
                </p>
              )}
            </div>
          )}

          {answerableFields.length > 0 && (
            <div className={styles.field}>
              <p className={styles.fieldLabel}>담당자가 채워야 하는 정보</p>
              {answerableFields.map((field) => {
                const presentation = slotPresentation(field.key)
                return (
                  <label key={field.key} className={styles.field}>
                    <span className={styles.fieldLabel}>{presentation.label}</span>
                    <input
                      type={presentation.type ?? 'text'}
                      className={styles.textInput}
                      placeholder={presentation.placeholder}
                      aria-label={presentation.label}
                      value={slotAnswers[field.key] ?? ''}
                      onChange={(event) =>
                        setSlotAnswers((prev) => ({ ...prev, [field.key]: event.target.value }))
                      }
                      disabled={running}
                      min={presentation.type === 'number' ? 0 : undefined}
                    />
                  </label>
                )
              })}
            </div>
          )}

          {nonAnswerableMissingSlots.length > 0 && (
            <div className={styles.policyBanner}>
              <p className={styles.policyBannerText}>
                아직 확인되지 않은 정보가 있습니다: {nonAnswerableMissingSlots.join(', ')} — 서류
                제출·OCR 검토가 먼저 필요합니다.
              </p>
            </div>
          )}

          {result.generated_documents.length > 0 && (
            <div className={styles.field}>
              <p className={styles.fieldLabel}>생성 문서</p>
              {result.generated_documents.map((doc) => (
                <div key={`${doc.template_id}-${doc.format}`} className={styles.plainRow}>
                  <span className={styles.plainValue}>
                    {doc.template_id} · {doc.status}
                  </span>
                  {doc.stored_file_id && (
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() =>
                        onDownloadDocument(
                          doc.stored_file_id as string,
                          `${doc.template_id}.${doc.format}`,
                        )
                      }
                    >
                      다운로드
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.case_signals.length > 0 && (
            <div className={styles.field}>
              <p className={styles.fieldLabel}>Case 신호</p>
              {result.case_signals.map((signal) => (
                <p key={signal} className={styles.plainValue}>
                  {signal}
                </p>
              ))}
            </div>
          )}
        </>
      )}

      {error && (
        <p className={styles.fieldError} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actionRow}>
        <button type="button" className={styles.textLink} onClick={handleClose} disabled={running}>
          닫기
        </button>
        {!result && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleRun}
            disabled={running || instruction.trim() === ''}
          >
            {running ? '실행 중…' : '실행'}
          </button>
        )}
        {result && answerableFields.length > 0 && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSubmitAnswers}
            disabled={running}
          >
            {running ? '실행 중…' : '답변 제출하고 다시 실행'}
          </button>
        )}
      </div>
    </Modal>
  )
}
