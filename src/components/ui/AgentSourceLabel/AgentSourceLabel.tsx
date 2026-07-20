import styles from './AgentSourceLabel.module.css'

export type AgentSource = 'rule' | 'data' | 'draft' | 'review'

const SOURCE_LABEL: Record<AgentSource, string> = {
  rule: '등록된 규칙',
  data: '보유 데이터',
  draft: 'Agent 초안',
  review: 'HR 확인',
}

const SOURCE_CLASS: Record<AgentSource, string> = {
  rule: styles.rule,
  data: styles.data,
  draft: styles.draft,
  review: styles.review,
}

export interface AgentSourceLabelProps {
  source?: AgentSource
}

export function AgentSourceLabel({ source = 'rule' }: AgentSourceLabelProps) {
  return <span className={`${styles.label} ${SOURCE_CLASS[source]}`}>{SOURCE_LABEL[source]}</span>
}
