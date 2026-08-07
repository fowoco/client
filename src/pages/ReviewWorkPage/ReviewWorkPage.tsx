import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { WorkflowStepIndicator } from '../../components/ui/WorkflowStepIndicator/WorkflowStepIndicator'
import styles from './ReviewWorkPage.module.css'
import { REVIEW_STEPS } from './reviewWorkData'
import { DraftPreparationStep } from './steps/DraftPreparationStep'
import { FinalReviewStep } from './steps/FinalReviewStep'
import { InformationPendingStep } from './steps/InformationPendingStep'

// REVIEW_STEPS 인덱스 기준 2~4단계(정보 보완/초안 준비/최종 검토) 내부 위저드.
// 1.요청 확인은 CreateWorkPage(/tasks/new)에서 진행되고, 같은 WorkflowStepIndicator를 공유한다.
type WizardStepIndex = 1 | 2 | 3

function parseStepIndex(value: string | null): WizardStepIndex {
  const parsed = Number(value)
  return parsed === 2 || parsed === 3 ? parsed : 1
}

export function ReviewWorkPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [stepIndex, setStepIndex] = useState<WizardStepIndex>(() => parseStepIndex(searchParams.get('step')))

  function handleStepClick(index: number) {
    if (index === 0) {
      navigate('/tasks/new')
      return
    }
    setStepIndex(index as WizardStepIndex)
  }

  return (
    <div>
      <div className={styles.topBar}>
        <Link to="/tasks/new" className={styles.back}>
          ← 업무 생성
        </Link>
      </div>

      <WorkflowStepIndicator steps={REVIEW_STEPS} currentIndex={stepIndex} onStepClick={handleStepClick} />

      {stepIndex === 1 && <InformationPendingStep onComplete={() => setStepIndex(2)} />}
      {stepIndex === 2 && <DraftPreparationStep onDone={() => setStepIndex(3)} />}
      {stepIndex === 3 && <FinalReviewStep />}
    </div>
  )
}
