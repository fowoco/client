import { useEffect, useState } from 'react'
import styles from '../ReviewWorkPage.module.css'
import { ANALYSIS_STAGES } from '../reviewWorkData'

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
      </div>

      <ul className={styles.analysisList}>
        {ANALYSIS_STAGES.map((stage, index) => (
          <li key={stage} className={styles.analysisRow}>
            <span
              className={`${styles.analysisIcon} ${index < doneCount ? styles.analysisIconDone : ''}`}
              aria-hidden="true"
            >
              {index < doneCount ? '✓' : index + 1}
            </span>
            {stage}
          </li>
        ))}
      </ul>
    </div>
  )
}
