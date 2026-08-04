import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { WorkItemRow } from '../../components/ui/WorkItemRow/WorkItemRow'
import { useAsyncDemoData } from '../../hooks/useAsyncDemoData'
import { CalendarIcon, CheckCircleIcon, WarningTriangleIcon } from './DashboardIcons'
import styles from './DashboardPage.module.css'
import {
  AGENT_PREPARED,
  AI_REQUEST_PROMPT_CHIPS,
  COMMAND_BAR,
  METRIC_STRIP,
  TODAY_WORK_ITEMS,
  TOP_APPROVAL,
  type MetricIconKey,
} from './dashboardData'

const METRIC_ICON: Record<MetricIconKey, typeof CheckCircleIcon> = {
  check: CheckCircleIcon,
  calendar: CalendarIcon,
  warning: WarningTriangleIcon,
  response: CheckCircleIcon,
}

export function DashboardPage() {
  const navigate = useNavigate()
  const status = useAsyncDemoData(TODAY_WORK_ITEMS.length === 0)
  const pendingApprovalCount = METRIC_STRIP.find((metric) => metric.id === 'pending-approval')?.value ?? 0

  return (
    <div>
      {status === 'success' && (
        <>
          <h1 className={styles.headline}>지금 확인이 필요한 승인 {pendingApprovalCount}건이 있습니다.</h1>
          <p className={styles.description}>
            Agent가 필요한 자료와 다음 행동을 먼저 준비했습니다. 검토와 최종 결정은 담당자가 수행합니다.
          </p>
        </>
      )}

      <div className={styles.commandBox}>
        <div className={styles.commandBoxHeader}>
          <span className={styles.commandBoxTitle}>✦ {COMMAND_BAR.title}</span>
          <span className={styles.commandBoxChevron} aria-hidden="true">
            ⌃
          </span>
        </div>
        <button type="button" className={styles.commandInput} onClick={() => navigate('/tasks/new')}>
          <span className={styles.commandPlaceholder}>{COMMAND_BAR.placeholder}</span>
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
      </div>

      <div className={styles.metricStrip}>
        {METRIC_STRIP.map((metric) => {
          const Icon = METRIC_ICON[metric.icon]
          return (
            <button key={metric.id} type="button" className={styles.metricCard} onClick={() => navigate('/tasks')}>
              <span className={styles.metricLabel}>{metric.label}</span>
              <span className={styles.metricValueRow}>
                <span className={styles.metricValue}>{metric.value}건 ›</span>
                <Icon className={styles.metricIcon} />
              </span>
            </button>
          )
        })}
      </div>

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
        <div className={styles.mainGrid}>
          <div className={styles.mainColumn}>
            <div className={styles.topApprovalCard}>
              <div className={styles.topApprovalHeader}>
                <h2 className={styles.sectionTitle}>먼저 검토할 승인 업무</h2>
                <span className={styles.sectionNote}>{TOP_APPROVAL.requestedLabel}</span>
              </div>
              <button
                type="button"
                className={styles.topApprovalItem}
                onClick={() => navigate(`/tasks/${TODAY_WORK_ITEMS[0].id}`)}
              >
                <span className={styles.topApprovalContent}>
                  <span className={styles.topApprovalTitle}>{TOP_APPROVAL.title}</span>
                  <span className={styles.topApprovalMeta}>{TOP_APPROVAL.meta}</span>
                  <span className={styles.topApprovalNote}>{TOP_APPROVAL.note}</span>
                </span>
                <span className={styles.topApprovalChevron} aria-hidden="true">
                  ›
                </span>
              </button>
              <button
                type="button"
                className={styles.topApprovalAction}
                onClick={() => navigate(`/tasks/${TODAY_WORK_ITEMS[0].id}`)}
              >
                {TOP_APPROVAL.actionLabel}
              </button>
            </div>

            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>오늘의 우선 업무</h2>
              <p className={styles.sectionNote}>지금 할 일 · {TODAY_WORK_ITEMS.length}건</p>
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
          </div>

          <aside className={styles.agentPanel}>
            <p className={styles.agentPanelTitle}>✦ Agent가 준비한 내용</p>
            <p className={styles.agentPanelSummary}>{AGENT_PREPARED.summary}</p>
            <p className={styles.agentPanelNote}>{AGENT_PREPARED.note}</p>

            <p className={styles.agentGroupLabel}>{AGENT_PREPARED.readyLabel}</p>
            <ul className={styles.agentReadyList}>
              {AGENT_PREPARED.ready.map((item) => (
                <li key={item.id} className={styles.agentReadyItem}>
                  <span aria-hidden="true">✓</span> {item.label}
                </li>
              ))}
            </ul>

            <div className={styles.agentNeedsInfoBox}>
              <p className={styles.agentGroupLabelWarning}>{AGENT_PREPARED.needsInfoLabel}</p>
              {AGENT_PREPARED.needsInfo.map((item) => (
                <div key={item.id} className={styles.agentPendingItem}>
                  <p className={styles.agentPendingLabel}>
                    <span aria-hidden="true">!</span> {item.label}
                  </p>
                  <p className={styles.agentPendingNote}>{item.note}</p>
                </div>
              ))}
            </div>

            <p className={styles.agentGroupLabel}>{AGENT_PREPARED.afterApprovalLabel}</p>
            {AGENT_PREPARED.afterApproval.map((item) => (
              <div key={item.id} className={styles.agentPendingItem}>
                <p className={styles.agentPendingLabel}>
                  <span aria-hidden="true">→</span> {item.label}
                </p>
                <p className={styles.agentPendingNote}>{item.note}</p>
              </div>
            ))}
          </aside>
        </div>
      )}
    </div>
  )
}
