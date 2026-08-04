import { useState } from 'react'
import { Button } from '../../../components/ui/Button/Button'
import { DetailRow } from '../../../components/ui/DetailRow/DetailRow'
import { Dropdown } from '../../../components/ui/Dropdown/Dropdown'
import { StatusLabel } from '../../../components/ui/StatusLabel/StatusLabel'
import { useToastStore } from '../../../store/toastStore'
import styles from '../ReviewWorkPage.module.css'
import {
  DRAFT_REASONS,
  HR_VERIFICATION_FIELDS,
  PREPARED_CHECKLIST,
  PREPARED_DRAFT,
  TARGET_OPTIONS,
  UNDERSTOOD_REQUEST,
} from '../reviewWorkData'

const TARGET_DROPDOWN_OPTIONS = TARGET_OPTIONS.map((option) => ({ value: option, label: option }))

export interface DraftReviewStepProps {
  onComplete: () => void
}

export function DraftReviewStep({ onComplete }: DraftReviewStepProps) {
  const showToast = useToastStore((state) => state.showToast)
  const [target, setTarget] = useState(PREPARED_DRAFT.target)
  const [verification, setVerification] = useState<Record<string, string>>(() =>
    Object.fromEntries(HR_VERIFICATION_FIELDS.map((field) => [field.key, ''])),
  )

  const canComplete = HR_VERIFICATION_FIELDS.every((field) => verification[field.key]?.trim() !== '')

  function handleVerificationChange(key: string, value: string) {
    setVerification((prev) => ({ ...prev, [key]: value }))
  }

  function handleSaveTemp() {
    // TODO(backend): PATCH /api/work-items/draft -> 현재 입력 상태 저장
    showToast('임시 저장했습니다.')
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

  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>Agent가 요청을 1개의 업무로 정리했습니다.</h1>
          <p className={styles.description}>HR이 확인할 정보를 입력하면 실행 가능한 업무 초안이 완성됩니다.</p>
        </div>
        <StatusLabel tone="warning">확인 필요 · {HR_VERIFICATION_FIELDS.length}</StatusLabel>
      </div>

      <div className={styles.workspace}>
        <div className={styles.draftPanel}>
          <div className={styles.draftPanelHeader}>
            <h2 className={styles.draftTitle}>AI가 준비한 업무 초안</h2>
            <span className={styles.draftBadge}>Agent 초안</span>
          </div>

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
            <div className={styles.checklistGrid}>
              {PREPARED_CHECKLIST.map((item) => (
                <p key={item} className={styles.checklistItem}>
                  <span aria-hidden="true">✓</span> {item}
                </p>
              ))}
            </div>
          </div>

          {target ? (
            <DetailRow label="대상" value={target} />
          ) : (
            <div className={styles.targetDropdownRow}>
              <span className={styles.fieldLabel}>대상</span>
              <Dropdown
                options={TARGET_DROPDOWN_OPTIONS}
                value={target ?? ''}
                onChange={setTarget}
                ariaLabel="대상 선택"
              />
            </div>
          )}
          <DetailRow label="담당자" value={PREPARED_DRAFT.assignee} />
          <DetailRow label="나라" value={PREPARED_DRAFT.country} />
          <DetailRow label="승인상태" value={PREPARED_DRAFT.approvalStatus} tone="warning" />
          <DetailRow label="필수 단계" value={`${PREPARED_DRAFT.requiredStepCount}개`} />
          <DetailRow label="완료 증빙" value={PREPARED_DRAFT.completionEvidence} />

          <div className={styles.reasonBox}>
            <p className={styles.reasonTitle}>이 초안을 준비한 이유</p>
            <div className={styles.reasonGrid}>
              {DRAFT_REASONS.map((reason) => (
                <p key={reason} className={styles.reasonItem}>
                  · {reason}
                </p>
              ))}
            </div>
          </div>

          <div className={styles.dueBadgeRow}>
            <span className={styles.dueBadge}>기한 · {PREPARED_DRAFT.dueLabel}</span>
          </div>

          <button type="button" className={styles.draftLink} onClick={handleEditDraft}>
            초안 내용 수정
          </button>
        </div>

        <div className={styles.left}>
          <div className={styles.card}>
            <div className={styles.draftPanelHeader}>
              <h2 className={styles.cardTitle}>Agent가 확인한 내용</h2>
              <span className={styles.draftBadge}>보유 데이터</span>
            </div>

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
            <h2 className={styles.missingTitle}>HR이 확인할 정보</h2>
            <p className={styles.missingQuestion}>근로자 서류 상태를 HR이 직접 확인해 입력해 주세요.</p>
            <div className={styles.verificationGrid}>
              {HR_VERIFICATION_FIELDS.map((field) => (
                <div key={field.key}>
                  <p className={styles.fieldLabel}>{field.label}</p>
                  <input
                    type="date"
                    className={styles.verificationInput}
                    aria-label={field.label}
                    value={verification[field.key] ?? ''}
                    onChange={(event) => handleVerificationChange(field.key, event.target.value)}
                  />
                </div>
              ))}
            </div>
            <p className={styles.missingWarning}>이 정보가 확인되기 전에는 승인 요청과 외부 전달이 차단됩니다.</p>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.editRequest} onClick={handleSaveTemp}>
          임시 저장
        </button>
        <Button onClick={onComplete} disabled={!canComplete}>
          완료
        </Button>
      </div>

      <p className={styles.footnote}>
        분석 근거는 근거 보기를 눌렀을 때만 표시됩니다. 근거 없는 확률 점수는 사용하지 않습니다.
      </p>
    </div>
  )
}
