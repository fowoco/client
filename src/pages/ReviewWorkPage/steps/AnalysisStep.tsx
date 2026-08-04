import { useEffect, useState } from 'react'
import { StatusLabel } from '../../../components/ui/StatusLabel/StatusLabel'
import styles from '../ReviewWorkPage.module.css'
import { ANALYSIS_STAGES, UNDERSTOOD_REQUEST } from '../reviewWorkData'

const STAGE_DELAY_MS = 500
const DONE_DELAY_MS = 400

export interface AnalysisStepProps {
  onDone: () => void
}

export function AnalysisStep({ onDone }: AnalysisStepProps) {
  const [doneCount, setDoneCount] = useState(0)

  // OnboardingImportPage의 분석 단계와 동일한 패턴 — setInterval 하나로 순서대로 진행하고
  // 마지막에 스스로 정리한다. 매 tick마다 effect를 다시 구독하는 방식은 fake timer 테스트에서
  // 재스케줄이 누락될 수 있어 피한다.
  useEffect(() => {
    const timer = setInterval(() => {
      setDoneCount((count) => {
        const next = count + 1
        if (next >= ANALYSIS_STAGES.length) {
          clearInterval(timer)
          setTimeout(onDone, DONE_DELAY_MS)
        }
        return next
      })
    }, STAGE_DELAY_MS)
    return () => clearInterval(timer)
  }, [onDone])

  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headline}>Agent가 요청을 분석하고 있습니다.</h1>
          <p className={styles.description}>등록된 근로자 정보와 처리 절차를 확인하고 있습니다.</p>
        </div>
        <StatusLabel tone="info">분석 중</StatusLabel>
      </div>

      <div className={styles.workspace}>
        <div className={styles.draftPanel}>
          <div className={styles.draftPanelHeader}>
            <h2 className={styles.draftTitle}>분석 진행 상황</h2>
            <span className={styles.draftBadge}>Agent 분석</span>
          </div>

          <div className={styles.checklist}>
            <p className={styles.checklistTitle}>단계별 진행</p>
            <div className={styles.checklistGrid}>
              {ANALYSIS_STAGES.map((stage, index) => (
                <p key={stage} className={styles.checklistItem}>
                  <span aria-hidden="true">{index < doneCount ? '✓' : '·'}</span> {stage}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.left}>
          <div className={styles.card}>
            <div className={styles.draftPanelHeader}>
              <h2 className={styles.cardTitle}>Agent가 이해한 요청</h2>
              <span className={styles.draftBadge}>실시간 분석</span>
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
          </div>
        </div>
      </div>
    </div>
  )
}
