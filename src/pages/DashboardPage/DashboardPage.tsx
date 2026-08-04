import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { WorkItemRow, type WorkItemStatusTone } from '../../components/ui/WorkItemRow/WorkItemRow'
import { useAsyncDemoData } from '../../hooks/useAsyncDemoData'
import agentSparkIcon from './assets/agent-spark.svg'
import commandSubmitIcon from './assets/command-submit.svg'
import styles from './DashboardPage.module.css'
import {
  AGENT_PREPARED,
  AI_REQUEST_PROMPT_CHIPS,
  APPROVAL_QUEUE,
  METRIC_STRIP,
  TODAY_WORK_ITEMS,
  type DashboardWorkStatus,
} from './dashboardData'

const STATUS_TONE: Record<DashboardWorkStatus, WorkItemStatusTone> = {
  승인대기: 'warning',
  요청전송: 'primary',
  서류대기: 'neutral',
}

export function DashboardPage() {
  const navigate = useNavigate()
  const status = useAsyncDemoData(TODAY_WORK_ITEMS.length === 0)

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.headline}>
          지금 확인이 필요한 승인 {APPROVAL_QUEUE.blockingCount}건이 있습니다.
        </h1>
        <p className={styles.description}>
          Agent가 필요한 자료와 다음 행동을 먼저 준비했습니다. 검토와 최종 결정은 담당자가 수행합니다.
        </p>
      </header>

      <section className={styles.agentRequest} aria-labelledby="agent-request-title">
        <div className={styles.agentRequestTitle}>
          <img src={agentSparkIcon} alt="" aria-hidden="true" />
          <h2 id="agent-request-title">Agent 업무 요청</h2>
        </div>
        <button
          type="button"
          className={styles.commandInput}
          onClick={() => navigate('/tasks/new')}
        >
          <span>처리할 업무를 자연어로 입력해 주세요. 예: 응웬반A의 체류기간 연장 준비</span>
          <img src={commandSubmitIcon} alt="업무 요청 입력하기" />
        </button>
        <div className={styles.promptChips}>
          {AI_REQUEST_PROMPT_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className={styles.promptChip}
              onClick={() => navigate('/tasks/new', { state: { prefill: chip } })}
            >
              {chip}
            </button>
          ))}
        </div>
      </section>

      {status === 'loading' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="loading"
            title="업무 현황을 불러오는 중입니다"
            body="기한·필수정보·응답 상태를 확인하고 있습니다."
            note="처리 중 · 중복 실행 차단"
          />
        </div>
      )}

      {status === 'error' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="error"
            title="업무 현황을 불러오지 못했습니다"
            body="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
            actionLabel="다시 시도"
            onAction={() => navigate('/dashboard', { replace: true })}
          />
        </div>
      )}

      {status === 'empty' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="empty"
            title="오늘 처리할 업무가 없습니다"
            body="새 요청을 입력하거나 파일을 가져와 업무를 만들어 보세요."
            actionLabel="업무 만들기"
            onAction={() => navigate('/tasks/new')}
          />
        </div>
      )}

      {status === 'success' && (
        <div className={styles.dashboardGrid}>
          <div className={styles.primaryColumn}>
            <div className={styles.metricStrip} aria-label="오늘의 업무 지표">
              {METRIC_STRIP.map((metric) => (
                <button
                  key={metric.id}
                  type="button"
                  className={styles.metricCard}
                  onClick={() => navigate(`/tasks?view=${metric.id}`)}
                >
                  <span className={styles.metricText}>
                    <span className={styles.metricLabel}>{metric.label}</span>
                    <span className={styles.metricValue}>{metric.value}건 ›</span>
                  </span>
                  <span className={`${styles.metricIcon} ${styles[`metricIcon_${metric.tone}`]}`}>
                    <img src={metric.iconSrc} alt="" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>

            <section className={styles.priorityApproval} aria-labelledby="priority-approval-title">
              <div className={styles.priorityHeader}>
                <h2 id="priority-approval-title">먼저 검토할 승인 업무</h2>
                <span>요청 · {APPROVAL_QUEUE.oldestValue}</span>
              </div>
              <div className={styles.priorityBody}>
                <div className={styles.priorityContent}>
                  <div className={styles.priorityCopy}>
                    <strong>{APPROVAL_QUEUE.title}</strong>
                    <span>{APPROVAL_QUEUE.meta}</span>
                    <span>{APPROVAL_QUEUE.note}</span>
                  </div>
                  <button type="button" onClick={() => navigate('/tasks')}>
                    승인 검토
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.priorityNext}
                  aria-label="다음 승인 업무"
                  onClick={() => navigate('/tasks')}
                >
                  ›
                </button>
              </div>
            </section>

            <section className={styles.todayTasks} aria-labelledby="today-tasks-title">
              <div className={styles.sectionHeader}>
                <h2 id="today-tasks-title">오늘의 우선 업무</h2>
                <p>지금 할 일 · {TODAY_WORK_ITEMS.length}건</p>
              </div>
              <div className={styles.workItemList}>
                {TODAY_WORK_ITEMS.map((item) => (
                  <WorkItemRow
                    key={item.id}
                    title={item.title}
                    statusLabel={item.status}
                    statusTone={STATUS_TONE[item.status]}
                    detailItems={[item.schedule, ...(item.assignee ? [item.assignee] : [])]}
                    nextAction={item.nextAction}
                    urgency={item.urgency}
                    onClick={() => navigate(`/tasks/${item.id}`)}
                  />
                ))}
              </div>
            </section>
          </div>

          <aside className={styles.agentPrepared} aria-labelledby="agent-prepared-title">
            <div className={styles.agentPreparedTitle}>
              <img src={agentSparkIcon} alt="" aria-hidden="true" />
              <h2 id="agent-prepared-title">Agent가 준비한 내용</h2>
            </div>
            <div className={styles.preparedIntro}>
              <strong>준비 완료 4건 · HR 확인 필요 2건</strong>
              <p>Agent는 초안까지만 준비하며, 검토와 승인은 담당자가 수행합니다.</p>
            </div>

            <div className={styles.preparedSections}>
              <section className={styles.preparedSection}>
                <h3>준비 완료 · 4건</h3>
                <ul>
                  {AGENT_PREPARED.prepared.map((item) => (
                    <li key={item.id}>
                      <span className={styles.doneMark}>✓</span>
                      <strong>{item.label}</strong>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={`${styles.preparedSection} ${styles.reviewSection}`}>
                <h3>HR 확인 필요 · 2건</h3>
                <ul>
                  {AGENT_PREPARED.review.map((item) => (
                    <li key={item.id} className={styles.describedItem}>
                      <span className={styles.reviewMark}>!</span>
                      <strong>{item.label}</strong>
                      <p>{item.description}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={styles.preparedSection}>
                <h3>승인 후 진행 · 2건</h3>
                <ul>
                  {AGENT_PREPARED.afterApproval.map((item) => (
                    <li key={item.id} className={styles.describedItem}>
                      <span className={styles.nextMark}>→</span>
                      <strong>{item.label}</strong>
                      <p>{item.description}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
