import { useState } from 'react'
import { Modal } from '../ui/Modal/Modal'
import { ONBOARDING_STEPS } from './onboardingSteps'
import styles from './OnboardingTour.module.css'

export interface OnboardingTourProps {
  open: boolean
  onFinish: () => void
}

export function OnboardingTour({ open, onFinish }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = ONBOARDING_STEPS[stepIndex]
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1

  function handleClose() {
    setStepIndex(0)
    onFinish()
  }

  function handleNext() {
    if (isLastStep) {
      handleClose()
      return
    }
    setStepIndex((index) => index + 1)
  }

  function handlePrev() {
    setStepIndex((index) => Math.max(0, index - 1))
  }

  return (
    <Modal open={open} onClose={handleClose} title={step.title}>
      <p className={styles.body}>{step.body}</p>

      <div className={styles.progress} aria-hidden="true">
        {ONBOARDING_STEPS.map((s, index) => (
          <span key={s.title} className={`${styles.dot} ${index === stepIndex ? styles.dotActive : ''}`} />
        ))}
      </div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.skipButton} onClick={handleClose}>
          건너뛰기
        </button>
        <div className={styles.navButtons}>
          {stepIndex > 0 && (
            <button type="button" className={styles.prevButton} onClick={handlePrev}>
              이전
            </button>
          )}
          <button type="button" className={styles.nextButton} onClick={handleNext}>
            {isLastStep ? '시작하기' : '다음'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
