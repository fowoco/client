import styles from './DecisionGate.module.css'

export type DecisionGateState = 'locked' | 'ready' | 'approved'

const CONTENT: Record<DecisionGateState, { title: string; body: string }> = {
  locked: { title: '실행할 수 없습니다', body: '필수정보를 먼저 입력해 주세요.' },
  ready: { title: 'HR 확인이 필요합니다', body: '확인 후 다음 단계가 활성화됩니다.' },
  approved: { title: '승인이 완료되었습니다', body: '다음 실행을 진행할 수 있습니다.' },
}

const GATE_CLASS: Record<DecisionGateState, string> = {
  locked: styles.locked,
  ready: styles.ready,
  approved: styles.approved,
}

const TITLE_CLASS: Record<DecisionGateState, string> = {
  locked: styles.titleLocked,
  ready: styles.titleReady,
  approved: styles.titleApproved,
}

export interface DecisionGateProps {
  state?: DecisionGateState
}

export function DecisionGate({ state = 'locked' }: DecisionGateProps) {
  const content = CONTENT[state]
  return (
    <div className={`${styles.gate} ${GATE_CLASS[state]}`}>
      <p className={`${styles.title} ${TITLE_CLASS[state]}`}>{content.title}</p>
      <p className={styles.body}>{content.body}</p>
    </div>
  )
}
