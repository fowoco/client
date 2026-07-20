import type { ReactNode } from 'react'
import styles from './WorkflowStep.module.css'

export type WorkflowStepState = 'pending' | 'active' | 'done' | 'blocked'

const DOT_CLASS: Record<WorkflowStepState, string> = {
  pending: styles.dotPending,
  active: styles.dotActive,
  done: styles.dotDone,
  blocked: styles.dotBlocked,
}

const LABEL_CLASS: Record<WorkflowStepState, string> = {
  pending: styles.labelPending,
  active: styles.labelActive,
  done: styles.labelDone,
  blocked: styles.labelBlocked,
}

export interface WorkflowStepProps {
  state?: WorkflowStepState
  children: ReactNode
}

export function WorkflowStep({ state = 'pending', children }: WorkflowStepProps) {
  return (
    <div className={styles.step}>
      <span className={`${styles.dot} ${DOT_CLASS[state]}`} aria-hidden="true" />
      <p className={`${styles.label} ${LABEL_CLASS[state]}`}>{children}</p>
    </div>
  )
}
