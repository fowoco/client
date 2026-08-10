import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardToday } from '../../components/layout/dashboardTodayContext'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { WorkItemRow } from '../../components/ui/WorkItemRow/WorkItemRow'
import agentSparkIcon from './assets/agent-spark.svg'
import commandSubmitIcon from './assets/command-submit.svg'
import styles from './DashboardPage.module.css'
import {
  AI_REQUEST_PROMPT_CHIPS,
  buildAgentPrepared,
  buildDashboardMetrics,
  buildDashboardWorkItems,
  buildUpcomingExpiries,
} from './dashboardData'

export function DashboardPage() {
  const navigate = useNavigate()
  const [agentRequest, setAgentRequest] = useState('')
  const agentRequestRef = useRef<HTMLTextAreaElement>(null)
  const { status, data: today, error, refetch, lastUpdatedAt } = useDashboardToday()
  const metrics = useMemo(() => (today ? buildDashboardMetrics(today.summary_counts) : []), [today])
  const workItems = useMemo(
    () =>
      today ? buildDashboardWorkItems(today.priority_tasks, today.upcoming_7_days) : [],
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
  const actionableWorkItems = workItems.filter((item) => item.group === 'actionable').slice(0, 4)
  const waitingWorkItems = workItems.filter((item) => item.group === 'waiting').slice(0, 3)
  const visibleUpcomingExpiries = upcomingExpiries.slice(0, 4)
  const agentLead =
    agentPrepared.prepared[0] ?? agentPrepared.afterApproval[0] ?? agentPrepared.review[0] ?? null
  const agentSummaryGroups = [
    {
      id: 'prepared',
      label: 'Agent 생성 초안',
      items: agentPrepared.prepared,
      mark: '✓',
    },
    {
      id: 'review',
      label: '담당자 확인 필요',
      items: agentPrepared.review,
      mark: '!',
    },
    {
      id: 'waiting',
      label: '응답·기관 대기',
      items: agentPrepared.afterApproval,
      mark: '→',
    },
  ]

  const headline = status === 'empty' ? '현재 등록된 업무가 없습니다.' : '오늘의 업무를 확인하세요.'

  function handleAgentRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const prefill = agentRequest.trim()
    if (!prefill) return
    navigate('/tasks/new', { state: { prefill } })
  }

  function handleAgentRequestKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  function handlePromptChipClick(chip: string) {
    setAgentRequest(chip)
    agentRequestRef.current?.focus()
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.headline}>{headline}</h1>
          <p className={styles.description}>
            기한과 진행 상태를 기준으로 담당자 행동이 필요한 업무를 우선 정리했습니다.
          </p>
        </div>
        {status === 'success' && (
          <div className={styles.updateInfo}>
            <span>최근 갱신 {lastUpdatedAt ?? '확인 중'}</span>
            <button type="button" onClick={refetch}>새로고침</button>
          </div>
        )}
      </header>

      <section className={styles.agentRequest} aria-labelledby="agent-request-title">
        <header className={styles.agentRequestCompact}>
          <div className={styles.agentRequestTitle}>
            <img src={agentSparkIcon} alt="" aria-hidden="true" />
            <div>
              <h2 id="agent-request-title">Agent에게 새 업무 요청</h2>
              <p>자연어 원문을 분석해 담당자 검토 전까지 준비합니다.</p>
            </div>
          </div>
          <span className={styles.agentFlow}>원문 분석 → 담당자 검토</span>
        </header>

        <div id="agent-request-body" className={styles.agentRequestBody}>
            <div className={styles.requestComposer}>
              <form className={styles.commandForm} onSubmit={handleAgentRequestSubmit}>
                <label className={styles.visuallyHidden} htmlFor="agent-work-request">
                  업무 내용
                </label>
                <div className={styles.commandField}>
                  <textarea
                    ref={agentRequestRef}
                    id="agent-work-request"
                    className={styles.commandInput}
                    value={agentRequest}
                    onChange={(event) => setAgentRequest(event.target.value)}
                    onKeyDown={handleAgentRequestKeyDown}
                    placeholder="예: 응웬반A의 체류기간 연장 준비"
                    aria-describedby="agent-request-hint"
                    rows={2}
                    maxLength={2000}
                  />
                  <button
                    type="submit"
                    className={styles.commandSubmit}
                    disabled={agentRequest.trim() === ''}
                  >
                    <img src={commandSubmitIcon} alt="" aria-hidden="true" />
                    <span>업무 분석</span>
                  </button>
                </div>
                <p id="agent-request-hint" className={styles.commandHint}>
                  입력한 원문 그대로 분석합니다 · Enter로 분석 · Shift+Enter로 줄바꿈
                </p>
              </form>
            </div>

            <aside className={styles.quickPromptPanel} aria-label="빠른 요청">
              <div className={styles.promptPanelHeader}>
                <strong>빠른 요청</strong>
                <span>자주 쓰는 업무로 시작하세요.</span>
              </div>
              <div className={styles.promptChips}>
                {AI_REQUEST_PROMPT_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className={styles.promptChip}
                    aria-pressed={agentRequest === chip}
                    onClick={() => handlePromptChipClick(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </aside>
          </div>
      </section>

      {status === 'loading' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="loading"
            title="업무 현황을 불러오는 중입니다"
            body="오늘의 최신 업무 상태를 확인하고 있습니다."
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
                aria-label={`${metric.label} ${metric.value}건 업무함에서 보기`}
                onClick={() => navigate(metric.href)}
              >
                <span className={styles.metricText}>
                  <span className={styles.metricLabel}>{metric.label}</span>
                  <span className={styles.metricValue}>{metric.value}건</span>
                </span>
              </button>
            ))}
          </div>

          <div className={styles.primaryColumn}>
            <section className={styles.priorityWorkspace} aria-labelledby="priority-work-title">
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.sectionEyebrow}>담당자 행동</span>
                  <h2 id="priority-work-title">담당자 우선 업무</h2>
                </div>
                <button type="button" onClick={() => navigate('/tasks')}>
                  전체 업무 보기
                </button>
              </div>

              <div className={styles.workspaceGroup}>
                <div className={styles.groupHeader}>
                  <h3>지금 처리할 업무</h3>
                  <span>{actionableWorkItems.length}건</span>
                </div>
                <div className={styles.workItemList}>
                  {actionableWorkItems.length > 0 ? (
                    actionableWorkItems.map((item) => (
                      <WorkItemRow
                        key={item.id}
                        workerLabel={item.workerName}
                        title={item.title}
                        statusLabel={item.status}
                        statusTone={item.statusTone}
                        detailItems={[item.deadline]}
                        nextActor={item.nextActor}
                        nextAction={item.nextAction}
                        urgency={item.urgency}
                        variant="flat"
                        onClick={() => navigate(`/tasks/${item.id}`)}
                        onEvidenceClick={() => navigate(`/tasks/${item.id}?context=open`)}
                      />
                    ))
                  ) : (
                    <p className={styles.sectionEmpty}>현재 담당자가 바로 처리할 업무가 없습니다.</p>
                  )}
                </div>
              </div>

              {waitingWorkItems.length > 0 && (
                <div className={styles.workspaceGroup}>
                  <div className={styles.groupHeader}>
                    <h3>응답을 기다리는 업무</h3>
                    <button type="button" onClick={() => navigate('/tasks?focus=worker-response')}>
                      {waitingWorkItems.length}건 보기
                    </button>
                  </div>
                  <div className={styles.workItemList}>
                    {waitingWorkItems.map((item) => (
                      <WorkItemRow
                        key={item.id}
                        workerLabel={item.workerName}
                        title={item.title}
                        statusLabel={item.status}
                        statusTone={item.statusTone}
                        detailItems={[item.deadline]}
                        nextActor={item.nextActor}
                        nextAction={item.nextAction}
                        urgency={item.urgency}
                        variant="flat"
                        onClick={() => navigate(`/tasks/${item.id}`)}
                        onEvidenceClick={() => navigate(`/tasks/${item.id}?context=open`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.workspaceGroup} aria-labelledby="upcoming-expiry-title">
                <div className={styles.groupHeader}>
                  <h3 id="upcoming-expiry-title">7일 이내 만료</h3>
                  <button type="button" onClick={() => navigate('/tasks')}>
                    전체 {upcomingExpiries.length}건 보기
                  </button>
                </div>
                {upcomingExpiries.length > 0 ? (
                  <ul className={styles.expiryList}>
                    {visibleUpcomingExpiries.map((item, index) => (
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
              </div>
            </section>
          </div>

          <aside className={styles.sideRail} aria-label="Agent 운영 요약">
            <section className={styles.agentPrepared} aria-labelledby="agent-prepared-title">
              <div className={styles.agentPreparedTitle}>
                <img src={agentSparkIcon} alt="" aria-hidden="true" />
                <span>업무 정리</span>
              </div>
              <h2 id="agent-prepared-title">Agent 작업 공간</h2>
              <div className={styles.preparedIntro}>
                <strong>
                  연결된 업무 {agentPrepared.connectedCount}건
                </strong>
                <p>Agent가 준비하거나 이어서 처리할 업무만 모았습니다.</p>
              </div>

              <div className={styles.agentLead}>
                <span>지금 먼저 볼 내용</span>
                <strong>{agentLead?.label ?? '현재 확인이 필요한 Agent 업무가 없습니다.'}</strong>
                <p>
                  {agentLead?.description ??
                    '새 업무가 준비되면 이 영역에서 가장 먼저 확인할 내용을 안내합니다.'}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(agentLead ? `/tasks/${agentLead.id}` : '/tasks')}
                >
                  {agentLead ? '내용 확인' : '업무함 보기'}
                </button>
              </div>

              <div className={styles.agentSummaryList}>
                {agentSummaryGroups.map((group) => {
                  const preview = group.items[0]
                  return (
                    <button
                      key={group.id}
                      type="button"
                      className={styles.agentSummaryItem}
                      onClick={() => navigate(preview ? `/tasks/${preview.id}` : '/tasks')}
                    >
                      <span className={styles.summaryMark}>{group.mark}</span>
                      <span>
                        <strong>
                          {group.label} · {group.items.length}건
                        </strong>
                        <small>{preview?.label ?? '현재 해당 업무가 없습니다.'}</small>
                      </span>
                      <em>›</em>
                    </button>
                  )
                })}
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}
