import { useState } from 'react'
import { Button } from '../../../components/ui/Button/Button'
import { useToastStore } from '../../../store/toastStore'
import styles from '../ReviewWorkPage.module.css'
import {
  GENERATION_GATE,
  HR_VERIFICATION_FIELDS,
  RESOLUTION_MATRIX_FOOTNOTE,
  RESOLUTION_MATRIX_META,
  RESOLUTION_ROWS,
  SECURE_LINK,
  WORKER_CANDIDATE,
} from '../reviewWorkData'

const OWNER_TONE_CLASS: Record<string, string> = {
  brand: styles.tableOwner,
  neutral: `${styles.tableOwner} ${styles.tableOwnerNeutral}`,
}

const STATE_TONE_CLASS: Record<string, string> = {
  brand: styles.pillBrand,
  neutral: styles.pillNeutral,
  green: styles.pillGreen,
  amber: styles.pillAmber,
  red: styles.pillRed,
}

export interface InformationPendingStepProps {
  onComplete: () => void
}

export function InformationPendingStep({ onComplete }: InformationPendingStepProps) {
  const showToast = useToastStore((state) => state.showToast)
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

  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>누락정보를 해결 주체별로 확인해 주세요</h1>
          <p className={styles.description}>
            필수정보의 담당자·수집 방법·차단 여부를 확인한 뒤 생성 가능한 초안만 준비합니다.
          </p>
        </div>
        <span className={styles.scenarioPill}>생성 가능</span>
      </div>

      <div className={styles.workspace}>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>해결할 정보</h2>
          <p className={styles.panelSubtitle}>{RESOLUTION_MATRIX_META}</p>

          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>해결 주체 · 정보</span>
              <span>차단 여부</span>
              <span>담당 · 수집 방법</span>
              <span>현재 상태</span>
            </div>

            {HR_VERIFICATION_FIELDS.map((field) => {
              const filled = verification[field.key]?.trim() !== ''
              return (
                <div key={field.key} className={styles.tableRow}>
                  <div className={styles.tableRowField}>
                    <span className={styles.tableOwner}>HR 직접 입력</span>
                    <span className={styles.tableFieldName}>{field.label}</span>
                  </div>
                  <span className={styles.tableBlocked}>비차단</span>
                  <input
                    type="date"
                    className={styles.tableVerificationInput}
                    aria-label={field.label}
                    value={verification[field.key] ?? ''}
                    onChange={(event) => handleVerificationChange(field.key, event.target.value)}
                  />
                  <span className={`${styles.pill} ${filled ? styles.pillGreen : styles.pillAmber}`}>
                    {filled ? '선택 완료' : '입력 필요'}
                  </span>
                </div>
              )
            })}

            {RESOLUTION_ROWS.map((row) => (
              <div key={row.field} className={styles.tableRow}>
                <div className={styles.tableRowField}>
                  <span className={OWNER_TONE_CLASS[row.ownerTone] ?? styles.tableOwner}>{row.owner}</span>
                  <span className={styles.tableFieldName}>{row.field}</span>
                </div>
                <span className={styles.tableBlocked}>{row.blocked}</span>
                <span className={styles.tableMethod}>{row.method}</span>
                <span className={`${styles.pill} ${STATE_TONE_CLASS[row.stateTone]}`}>{row.state}</span>
              </div>
            ))}
          </div>

          <p className={styles.footnote}>{RESOLUTION_MATRIX_FOOTNOTE}</p>
        </div>

        <div className={styles.railStack}>
          <div className={styles.railCard}>
            <div className={styles.railCardTitleRow}>
              <p className={styles.railCardTitle}>근로자 보안 링크</p>
              <span className={`${styles.pill} ${styles.pillGreen}`}>{SECURE_LINK.status}</span>
            </div>
            <p className={styles.railCardMeta}>{SECURE_LINK.title}</p>
            <p className={styles.railCardMeta}>{SECURE_LINK.meta}</p>
            <p className={styles.railCardMeta}>{SECURE_LINK.note}</p>
            <div className={styles.railCardLinkRow}>
              <button type="button" className={styles.railLink}>
                요청문 보기
              </button>
              <button type="button" className={styles.railLinkMuted}>
                링크 재발급
              </button>
            </div>
          </div>

          <div className={styles.railCardSubtle}>
            <div className={styles.railCardTitleRow}>
              <p className={styles.railCardTitle}>근로자 응답 후보</p>
              <span className={`${styles.pill} ${styles.pillBrand}`}>{WORKER_CANDIDATE.sourceLabel}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoRowLabel}>{WORKER_CANDIDATE.fieldLabel}</span>
              <span className={styles.railCardValue}>{WORKER_CANDIDATE.value}</span>
            </div>
            <p className={styles.railCardMeta}>{WORKER_CANDIDATE.note}</p>
            <p className={styles.railCardTitleBrand}>{WORKER_CANDIDATE.reflectedBy}</p>
          </div>

          <div className={styles.railCard}>
            <p className={styles.railCardTitle}>생성 가능 범위</p>
            <div className={styles.infoRow}>
              <span className={styles.infoRowLabel}>초안 대기</span>
              <span className={styles.railCardCountGreen}>{GENERATION_GATE.readyCount}건</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoRowLabel}>선행 단계가 필요한 문서</span>
              <span className={styles.railCardValueCompact}>{GENERATION_GATE.blockedCount}건</span>
            </div>
            <p className={styles.railCardMeta}>{GENERATION_GATE.note}</p>
          </div>
        </div>
      </div>

      <div className={styles.actionDock}>
        <div>
          <p className={styles.dockTitle}>현재 생성 가능한 문서의 필수정보를 모두 확인했습니다.</p>
          <p className={styles.dockSubtitle}>
            선행 단계가 남으면 검토 가능한 초안과 ‘선행 단계 필요’ 상태를 분리합니다.
          </p>
        </div>
        <div className={styles.dockActions}>
          <Button variant="secondary" onClick={handleSaveTemp}>
            임시 저장
          </Button>
          <Button onClick={onComplete} disabled={!canComplete}>
            초안 생성
          </Button>
        </div>
      </div>
    </div>
  )
}
