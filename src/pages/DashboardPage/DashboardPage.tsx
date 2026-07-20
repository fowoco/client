import { useNavigate } from 'react-router-dom'
import { AgentSummary } from '../../components/ui/AgentSummary/AgentSummary'
import { WorkItemRow } from '../../components/ui/WorkItemRow/WorkItemRow'
import styles from './DashboardPage.module.css'
import {
  AGENT_SUMMARY,
  APPROVAL_QUEUE,
  TODAY_WORK_ITEMS,
  UPCOMING_TIMELINE,
} from './dashboardData'

export function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div>
      <h1 className={styles.headline}>
        오늘 {APPROVAL_QUEUE.count}건의 승인이 업무 진행을 막고 있습니다.
      </h1>
      <p className={styles.description}>
        Agent가 기한·필수정보·응답 상태를 확인해 지금 볼 업무만 정리했습니다.
      </p>

      <button
        type="button"
        className={styles.commandInput}
        onClick={() => navigate('/tasks/new')}
      >
        <span className={styles.commandPlaceholder}>
          무엇을 준비해야 하나요? 자연어로 요청하거나 파일을 가져오세요.
        </span>
        <span className={styles.commandShortcut}>⌘ 업무 생성</span>
      </button>

      <div className={styles.summaryRow}>
        <AgentSummary
          headline={AGENT_SUMMARY.headline}
          body={AGENT_SUMMARY.body}
          actionLabel={AGENT_SUMMARY.actionLabel}
        />

        <div className={styles.approvalCard}>
          <p className={styles.approvalLabel}>내 승인 대기</p>
          <p className={styles.approvalCount}>{APPROVAL_QUEUE.count}건</p>
          <p className={styles.approvalOldest}>
            {APPROVAL_QUEUE.oldestLabel}
            <br />
            {APPROVAL_QUEUE.oldestValue}
          </p>
          <button type="button" className={styles.approvalLink} onClick={() => navigate('/tasks')}>
            검토하기 →
          </button>
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>지금 처리할 업무</h2>
        <p className={styles.sectionNote}>우선순위와 다음 행동 기준 · 최대 5건</p>
      </div>

      <div className={styles.workItemList}>
        {TODAY_WORK_ITEMS.map((item) => (
          <WorkItemRow
            key={item.id}
            title={item.title}
            meta={item.meta}
            nextAction={item.nextAction}
            urgency={item.urgency}
            onClick={() => navigate(`/tasks/${item.id}`)}
          />
        ))}
      </div>

      <div className={styles.timeline}>
        <span className={styles.timelineLabel}>다가오는 7일</span>
        {UPCOMING_TIMELINE.map((item) => (
          <span key={item} className={styles.timelineItem}>
            {item}
          </span>
        ))}
      </div>

      <p className={styles.footnote}>
        근거·문서·활동이력은 업무 선택 후 Context Drawer에서 확인합니다.
      </p>
    </div>
  )
}
