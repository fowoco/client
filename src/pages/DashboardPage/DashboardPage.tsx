import type { CSSProperties } from 'react'
import styles from './DashboardPage.module.css'
import {
  AGENT_RECOMMENDATION,
  DASHBOARD_STATS,
  TASK_BOARD_PREVIEW,
  TODAY_DETECTED_TASK_COUNT,
  WORKER_CONFIRMATION_LOOP,
} from './dashboardData'

interface StatCardStyle extends CSSProperties {
  '--stat-color'?: string
}

export function DashboardPage() {
  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <p className={styles.banner}>오늘 Agent가 감지한 업무 {TODAY_DETECTED_TASK_COUNT}건</p>

        <div className={styles.statGrid}>
          {DASHBOARD_STATS.map((stat) => (
            <div
              key={stat.label}
              className={styles.statCard}
              style={{ '--stat-color': stat.color } as StatCardStyle}
            >
              <p className={styles.statLabel}>{stat.label}</p>
              <span className={styles.statValue}>{stat.count}</span>
              <span className={styles.statUnit}>{stat.unit}</span>
            </div>
          ))}
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>업무 카드 보드</h2>
          <div className={styles.taskGrid}>
            {TASK_BOARD_PREVIEW.map((task) => (
              <div key={task.title} className={styles.taskCard}>
                {task.title}
              </div>
            ))}
          </div>
        </section>

        <p className={styles.loopBanner}>{WORKER_CONFIRMATION_LOOP}</p>
      </div>

      <aside className={styles.agentPanel}>
        <h2 className={styles.agentPanelTitle}>FOWOCO Agent 추천</h2>
        <div className={styles.agentCard}>
          <span className={styles.agentBadge}>⚠️ {AGENT_RECOMMENDATION.badge}</span>
          <p className={styles.agentCardTitle}>{AGENT_RECOMMENDATION.title}</p>
          <p className={styles.agentCardDetail}>{AGENT_RECOMMENDATION.detail}</p>
          <button type="button" className={styles.agentAction}>
            {AGENT_RECOMMENDATION.actionLabel}
          </button>
        </div>
      </aside>
    </div>
  )
}
