import { useState } from 'react'
import { Link } from 'react-router-dom'
import { WorkflowStepIndicator } from '../../components/ui/WorkflowStepIndicator/WorkflowStepIndicator'
import styles from './ReviewWorkPage.module.css'
import { REVIEW_STEPS } from './reviewWorkData'
import { AnalysisStep } from './steps/AnalysisStep'
import { ApprovalStep } from './steps/ApprovalStep'
import { DraftReviewStep } from './steps/DraftReviewStep'
import { TaskCreationStep } from './steps/TaskCreationStep'

// REVIEW_STEPS 인덱스 기준 2~5단계(AI분석/초안검토/업무생성/승인) 내부 위저드.
// 1.요청입력은 CreateWorkPage(/tasks/new)에서 진행되고, 같은 WorkflowStepIndicator를 공유한다.
type WizardStepIndex = 1 | 2 | 3 | 4

export function ReviewWorkPage() {
  const [stepIndex, setStepIndex] = useState<WizardStepIndex>(1)

  return (
    <div>
      <div className={styles.topBar}>
        <Link to="/tasks/new" className={styles.back}>
          ← 업무 생성
        </Link>
      </div>

      <WorkflowStepIndicator steps={REVIEW_STEPS} currentIndex={stepIndex} />

      {stepIndex === 1 && <AnalysisStep onDone={() => setStepIndex(2)} />}
      {stepIndex === 2 && <DraftReviewStep onComplete={() => setStepIndex(3)} />}
      {stepIndex === 3 && <TaskCreationStep onDone={() => setStepIndex(4)} />}
      {stepIndex === 4 && <ApprovalStep />}
    </div>
  )
}
