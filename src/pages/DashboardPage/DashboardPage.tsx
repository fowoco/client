import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchDashboardToday, type DashboardTodayResponse } from '../../api/dashboard'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { WorkItemRow } from '../../components/ui/WorkItemRow/WorkItemRow'
import { useApiQuery } from '../../hooks/useApiQuery'
import agentSparkIcon from './assets/agent-spark.svg'
import commandSubmitIcon from './assets/command-submit.svg'
import styles from './DashboardPage.module.css'
import {
  AI_REQUEST_PROMPT_CHIPS,
  buildAgentPrepared,
  buildDashboardMetrics,
  buildDashboardWorkItems,
  buildPriorityApproval,
  buildUpcomingExpiries,
} from './dashboardData'

export function DashboardPage() {
  const navigate = useNavigate()
  const [agentRequest, setAgentRequest] = useState('')
  const todayFetcher = useCallback(() => fetchDashboardToday('Asia/Seoul'), [])
  const isEmpty = useCallback(
    (today: DashboardTodayResponse) =>
      today.priority_tasks.length === 0 &&
      today.upcoming_7_days.length === 0 &&
      today.recommendations.connected_count === 0 &&
      Object.values(today.summary_counts).every((count) => count === 0),
    [],
  )
  const { status, data: today, error, refetch } = useApiQuery(todayFetcher, isEmpty)
  const metrics = useMemo(() => (today ? buildDashboardMetrics(today.summary_counts) : []), [today])
  const workItems = useMemo(
    () => (today ? buildDashboardWorkItems(today.priority_tasks) : []),
    [today],
  )
  const priorityApproval = useMemo(
    () => (today ? buildPriorityApproval(today.priority_tasks) : null),
    [today],
  )
  const agentPrepared = useMemo(
    () =>
      today
        ? buildAgentPrepared(today.recommendations)
        : { connectedCount: 0, prepared: [], review: [], afterApproval: [] },
    [today],
  )
  const upcomingExpiries = useMemo(
    () => (today ? buildUpcomingExpiries(today.upcoming_7_days) : []),
    [today],
  )
  const pendingApprovalCount = today?.approval_count ?? 0

  const headline =
    status === 'success'
      ? `지금 확인이 필요한 승인 ${pendingApprovalCount}건이 있습니다.`
      : status === 'empty'
        ? '현재 등록된 업무가 없습니다.'
        : '업무 현황을 확인하고 있습니다.'

  function handleAgentRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const prefill = agentRequest.trim()
    if (!prefill) return
    navigate('/tasks/new', { state: { prefill } })
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.headline}>{headline}</h1>
        <p className={styles.description}>
          Today API의 최신 상태와 기한을 기준으로 지금 확인할 업무를 정리합니다.
        </p>
      </header>

      <section className={styles.agentRequest} aria-labelledby="agent-request-title">
        <div className={styles.agentRequestTitle}>
          <img src={agentSparkIcon} alt="" aria-hidden="true" />
          <h2 id="agent-request-title">Agent 업무 요청</h2>
        </div>
        <form className={styles.commandForm} onSubmit={handleAgentRequestSubmit}>
          <input
            type="text"
            className={styles.commandInput}
            value={agentRequest}
            onChange={(event) => setAgentRequest(event.target.value)}
            placeholder="처리할 업무를 자연어로 입력해 주세요. 예: 응웬반A의 체류기간 연장 준비"
            aria-label="Agent 업무 요청"
            maxLength={2000}
          />
          <button
            type="submit"
            className={styles.commandSubmit}
            aria-label="업무 요청 계속하기"
            disabled={agentRequest.trim() === ''}
          >
            <img src={commandSubmitIcon} alt="" aria-hidden="true" />
          </button>
        </form>
        <div className={styles.promptChips}>
          {AI_REQUEST_PROMPT_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className={styles.promptChip}
              aria-pressed={agentRequest === chip}
              onClick={() => setAgentRequest(chip)}
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
            body="Today API에서 최신 업무 상태를 확인하고 있습니다."
            note="처리 중 · 중복 실행 차단"
          />
        </div>
      )}

      {status === 'error' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="error"
            title="업무 현황을 불러오지 못했습니다"
            body={error?.message ?? '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'}
            actionLabel="다시 시도"
            onAction={refetch}
          />
        </div>
      )}

      {status === 'empty' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="empty"
            title="등록된 업무가 없습니다"
            body="새 요청을 입력하거나 파일을 가져와 업무를 만들어 보세요."
            actionLabel="업무 만들기"
            onAction={() => navigate('/tasks/new')}
          />
        </div>
      )}

      {status === 'success' && (
        <div className={styles.dashboardGrid}>
          <div className={styles.metricStrip} aria-label="오늘의 업무 지표">
            {metrics.map((metric) => (
              <button
                key={metric.id}
                type="button"
                className={styles.metricCard}
                onClick={() => navigate('/tasks')}
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

          <div className={styles.primaryColumn}>
            <section className={styles.priorityApproval} aria-labelledby="priority-approval-title">
              <div className={styles.priorityHeader}>
                <h2 id="priority-approval-title">먼저 검토할 승인 업무</h2>
                <span>
                  {priorityApproval ? `요청 · ${priorityApproval.requestedLabel}` : '승인 대기 0건'}
                </span>
              </div>
              {priorityApproval ? (
                <div className={styles.priorityBody}>
                  <div className={styles.priorityContent}>
                    <div className={styles.priorityCopy}>
                      <strong>{priorityApproval.title}</strong>
                      <span>{priorityApproval.meta}</span>
                      <span>{priorityApproval.note}</span>
                    </div>
                    <button type="button" onClick={() => navigate(`/tasks/${priorityApproval.id}`)}>
                      승인 검토
                    </button>
                  </div>
                  <button
                    type="button"
                    className={styles.priorityNext}
                    aria-label="승인 업무 상세 열기"
                    onClick={() => navigate(`/tasks/${priorityApproval.id}`)}
                  >
                    ›
                  </button>
                </div>
              ) : (
                <div className={styles.priorityEmpty}>
                  <p>현재 담당자 승인을 기다리는 업무가 없습니다.</p>
                  <button type="button" onClick={() => navigate('/tasks')}>
                    업무함 보기
                  </button>
                </div>
              )}
            </section>

            <section className={styles.todayTasks} aria-labelledby="today-tasks-title">
              <div className={styles.sectionHeader}>
                <h2 id="today-tasks-title">오늘의 우선 업무</h2>
                <p>지금 할 일 · {workItems.length}건</p>
              </div>
              <div className={styles.workItemList}>
                {workItems.length > 0 ? (
                  workItems.map((item) => (
                    <WorkItemRow
                      key={item.id}
                      title={item.title}
                      statusLabel={item.status}
                      statusTone={item.statusTone}
                      detailItems={[item.schedule]}
                      nextAction={item.nextAction}
                      urgency={item.urgency}
                      onClick={() => navigate(`/tasks/${item.id}`)}
                    />
                  ))
                ) : (
                  <p className={styles.sectionEmpty}>오늘 우선 처리할 업무가 없습니다.</p>
                )}
              </div>
            </section>

            <section className={styles.upcomingExpiry} aria-labelledby="upcoming-expiry-title">
              <div className={styles.sectionHeader}>
                <h2 id="upcoming-expiry-title">7일 이내 만료</h2>
                <p>체류·계약·서류 · {upcomingExpiries.length}건</p>
              </div>
              {upcomingExpiries.length > 0 ? (
                <ul className={styles.expiryList}>
                  {upcomingExpiries.map((item, index) => (
                    <li key={`${item.workerId}-${item.label}-${index}`}>
                      <button
                        type="button"
                        className={`${styles.expiryItem} ${styles[`expiryItem_${item.urgency}`]}`}
                        onClick={() => navigate(`/workers/${item.workerId}/detail`)}
                      >
                        <span>
                          <strong>{item.workerName}</strong>
                          <small>{item.label}</small>
                        </span>
                        <em>{item.dateLabel} ›</em>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.sectionEmpty}>7일 이내 만료 예정 항목이 없습니다.</p>
              )}
            </section>
          </div>

          <aside className={styles.agentPrepared} aria-labelledby="agent-prepared-title">
            <div className={styles.agentPreparedTitle}>
              <img src={agentSparkIcon} alt="" aria-hidden="true" />
              <h2 id="agent-prepared-title">Agent가 준비한 내용</h2>
            </div>
            <div className={styles.preparedIntro}>
              <strong>
                연결된 업무 {agentPrepared.connectedCount}건 · 담당자 확인 필요{' '}
                {agentPrepared.review.length}건
              </strong>
              <p>
                승인 대기 {today?.approval_count ?? 0}건 · 근로자 응답{' '}
                {today?.worker_response_count ?? 0}건
              </p>
            </div>

            <div className={styles.preparedSections}>
              <section className={styles.preparedSection}>
                <h3>Agent 생성 초안 · {agentPrepared.prepared.length}건</h3>
                {agentPrepared.prepared.length > 0 ? (
                  <ul>
                    {agentPrepared.prepared.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={styles.preparedItemButton}
                          onClick={() => navigate(`/tasks/${item.id}`)}
                        >
                          <span className={styles.doneMark}>✓</span>
                          <strong>{item.label}</strong>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.preparedEmpty}>현재 표시할 Agent 초안이 없습니다.</p>
                )}
              </section>

              <section className={`${styles.preparedSection} ${styles.reviewSection}`}>
                <h3>담당자 확인 필요 · {agentPrepared.review.length}건</h3>
                {agentPrepared.review.length > 0 ? (
                  <ul>
                    {agentPrepared.review.map((item) => (
                      <li key={item.id} className={styles.describedItem}>
                        <button
                          type="button"
                          className={styles.preparedItemButton}
                          onClick={() => navigate(`/tasks/${item.id}`)}
                        >
                          <span className={styles.reviewMark}>!</span>
                          <strong>{item.label}</strong>
                          <p>{item.description}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.preparedEmpty}>현재 확인이 필요한 업무가 없습니다.</p>
                )}
              </section>

              <section className={styles.preparedSection}>
                <h3>응답·기관 대기 · {agentPrepared.afterApproval.length}건</h3>
                {agentPrepared.afterApproval.length > 0 ? (
                  <ul>
                    {agentPrepared.afterApproval.map((item) => (
                      <li key={item.id} className={styles.describedItem}>
                        <button
                          type="button"
                          className={styles.preparedItemButton}
                          onClick={() => navigate(`/tasks/${item.id}`)}
                        >
                          <span className={styles.nextMark}>→</span>
                          <strong>{item.label}</strong>
                          <p>{item.description}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.preparedEmpty}>현재 대기 중인 업무가 없습니다.</p>
                )}
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
