import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTasks } from '../../api/tasks'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { WorkItemRow } from '../../components/ui/WorkItemRow/WorkItemRow'
import { useApiQuery } from '../../hooks/useApiQuery'
import styles from './DashboardPage.module.css'
import {
  AI_REQUEST_PROMPT_CHIPS,
  buildDashboardMetrics,
  buildDashboardWorkItems,
  buildUpcomingTimeline,
} from './dashboardData'

export function DashboardPage() {
  const navigate = useNavigate()
  const taskFetcher = useCallback(() => fetchTasks({ size: 100 }), [])
  const isEmpty = useCallback((page: { items: unknown[] }) => page.items.length === 0, [])
  const { status, data: taskPage, error, refetch } = useApiQuery(taskFetcher, isEmpty)
  const tasks = useMemo(() => taskPage?.items ?? [], [taskPage])
  const metrics = useMemo(() => buildDashboardMetrics(tasks), [tasks])
  const workItems = useMemo(() => buildDashboardWorkItems(tasks), [tasks])
  const upcomingTimeline = useMemo(() => buildUpcomingTimeline(tasks), [tasks])

  return (
    <div>
      <button type="button" className={styles.commandInput} onClick={() => navigate('/tasks/new')}>
        <span className={styles.commandPlaceholder}>
          무엇을 준비해야 하나요? 자연어로 요청하거나 파일을 가져오세요.
        </span>
        <span className={styles.commandShortcut}>⌘ 업무 생성</span>
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

      {status === 'loading' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="loading"
            title="업무 현황을 불러오는 중입니다"
            body="Task API에서 최신 업무 상태를 확인하고 있습니다."
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
        <>
          <div className={styles.metricStrip}>
            {metrics.map((metric) => (
              <button
                key={metric.id}
                type="button"
                className={styles.metricCard}
                onClick={() => navigate('/tasks')}
              >
                <span className={styles.metricLabel}>{metric.label}</span>
                <span className={styles.metricValue}>{metric.value}건 ›</span>
              </button>
            ))}
          </div>

          <h1 className={styles.headline}>지금 처리할 업무 {workItems.length}건을 확인해 주세요.</h1>
          <p className={styles.description}>
            Task API의 기한과 상태를 기준으로 최대 5건을 정리했습니다. 승인 대기 수치는 승인 API 연결 전까지 표시하지 않습니다.
          </p>

          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>지금 처리할 업무</h2>
            <p className={styles.sectionNote}>기한 오름차순 · 최대 5건</p>
          </div>

          <div className={styles.workItemList}>
            {workItems.map((item) => (
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

          {upcomingTimeline.length > 0 && (
            <div className={styles.timeline}>
              <span className={styles.timelineLabel}>다가오는 7일</span>
              {upcomingTimeline.map((item) => (
                <span key={item} className={styles.timelineItem}>{item}</span>
              ))}
            </div>
          )}

          {taskPage && taskPage.total_elements > 100 && (
            <p className={styles.capNotice}>최근 100건 기준으로 계산했습니다. 전체 업무는 업무함에서 확인해 주세요.</p>
          )}
          <p className={styles.footnote}>근거·문서·활동이력은 업무를 연 뒤 확인할 수 있습니다.</p>
        </>
      )}
    </div>
  )
}
