import styles from './WorkflowStepIndicator.module.css'

export interface WorkflowStep {
  no: string
  label: string
}

export interface WorkflowStepIndicatorProps {
  steps: WorkflowStep[]
  currentIndex: number
  /** 지정하면 각 단계를 클릭해 자유롭게 이동할 수 있다. */
  onStepClick?: (index: number) => void
}

// CreateWorkPage(1.요청 확인)와 ReviewWorkPage(2~4단계)가 함께 쓰는 진행 표시기.
// 하나로 이어지는 흐름처럼 보이도록 두 페이지에서 같은 컴포넌트·같은 steps 데이터를 쓴다.
export function WorkflowStepIndicator({ steps, currentIndex, onStepClick }: WorkflowStepIndicatorProps) {
  return (
    <ol className={styles.stepIndicator} aria-label="진행 단계">
      {steps.map((step, index) => {
        // TODO(backend): ✓는 지금 위저드 위치 기준 표시 — 백엔드 연동 후에는 실제 단계 완료 상태로 대체한다.
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        const label = isDone ? `✓ ${step.label}` : `${step.no} ${step.label}`
        return (
          <li key={step.no} className={styles.stepItem}>
            {onStepClick ? (
              <button
                type="button"
                className={`${styles.stepPill} ${isDone ? styles.stepPillDone : ''} ${
                  isCurrent ? styles.stepPillCurrent : ''
                }`}
                onClick={() => onStepClick(index)}
              >
                {label}
              </button>
            ) : (
              <span
                className={`${styles.stepPill} ${isDone ? styles.stepPillDone : ''} ${
                  isCurrent ? styles.stepPillCurrent : ''
                }`}
              >
                {label}
              </span>
            )}
            {index < steps.length - 1 && (
              <span className={styles.stepArrow} aria-hidden="true">
                →
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
