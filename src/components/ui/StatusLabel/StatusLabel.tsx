import type { ReactNode } from 'react'
import styles from './StatusLabel.module.css'

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'critical' | 'agent'

const TONE_LABEL: Record<StatusTone, string> = {
  neutral: '진행 중',
  info: '안내',
  success: '완료',
  warning: '확인 필요',
  critical: '실행 차단',
  agent: 'Agent 준비',
}

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: styles.neutral,
  info: styles.info,
  success: styles.success,
  warning: styles.warning,
  critical: styles.critical,
  agent: styles.agent,
}

export interface StatusLabelProps {
  tone?: StatusTone
  /** 지정하지 않으면 tone의 기본 한글 라벨을 사용한다 (예: "확인 필요") */
  children?: ReactNode
}

export function StatusLabel({ tone = 'neutral', children }: StatusLabelProps) {
  return (
    <span className={`${styles.label} ${TONE_CLASS[tone]}`}>{children ?? TONE_LABEL[tone]}</span>
  )
}
