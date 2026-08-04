import styles from './WorkflowStepIndicator.module.css'

export interface WorkflowStep {
  no: string
  label: string
}

export interface WorkflowStepIndicatorProps {
  steps: WorkflowStep[]
  currentIndex: number
}

// CreateWorkPage(1.요청입력)와 ReviewWorkPage(2~5단계)가 함께 쓰는 5단계 진행 표시기.
// 하나로 이어지는 흐름처럼 보이도록 두 페이지에서 같은 컴포넌트·같은 steps 데이터를 쓴다.
export function WorkflowStepIndicator({ steps, currentIndex }: WorkflowStepIndicatorProps) {
  return (
    <ol className={styles.stepIndicator} aria-label="진행 단계">
      {steps.map((step, index) => (
        <li
          key={step.no}
          className={`${styles.stepItem} ${index <= currentIndex ? styles.stepItemDone : ''} ${
            index === currentIndex ? styles.stepItemCurrent : ''
          }`}
        >
          <span aria-hidden="true">{index < currentIndex ? '✓' : step.no}</span>
          {step.label}
          {index < steps.length - 1 && (
            <span className={styles.stepArrow} aria-hidden="true">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}
