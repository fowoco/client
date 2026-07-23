import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AgentSourceLabel } from '../../components/ui/AgentSourceLabel/AgentSourceLabel'
import { Dropdown } from '../../components/ui/Dropdown/Dropdown'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ListRow } from '../../components/ui/ListRow/ListRow'
import { useAsyncDemoData } from '../../hooks/useAsyncDemoData'
import { AGENT_LOGS, PERIOD_OPTIONS, SOURCE_OPTIONS, TOTAL_AGENT_LOG_COUNT } from './agentLogData'
import styles from './AgentLogPage.module.css'

export function AgentLogPage() {
  const navigate = useNavigate()
  const status = useAsyncDemoData(AGENT_LOGS.length === 0)
  const [period, setPeriod] = useState('all')
  const [source, setSource] = useState('all')

  const visibleLogs = useMemo(() => {
    return AGENT_LOGS.filter((log) => {
      const matchesSource = source === 'all' || log.source === source
      const matchesPeriod =
        period === 'all' ||
        (period === 'today' && log.daysAgo === 0) ||
        (period !== 'today' && log.daysAgo <= Number(period))
      return matchesSource && matchesPeriod
    })
  }, [source, period])

  function handleOpenRelatedWork(caseId: string) {
    navigate(`/tasks/${caseId}`)
  }

  return (
    <div>
      <h1 className={styles.headline}>Agent가 처리한 업무 이력</h1>
      <p className={styles.description}>
        Agent가 어떤 근거로 판단했는지 시간순으로 확인하고, 관련 업무로 바로 이동할 수 있습니다.
      </p>

      <div className={styles.toolbar}>
        {/* TODO(backend): GET /api/agent-logs?period= -> 현재는 클라이언트에서 daysAgo로 필터링, 추후 서버 쿼리로 대체 */}
        <Dropdown options={PERIOD_OPTIONS} value={period} onChange={setPeriod} ariaLabel="기간 필터" />
        <Dropdown options={SOURCE_OPTIONS} value={source} onChange={setSource} ariaLabel="근거 출처 필터" />
      </div>

      {status === 'loading' && (
        <div className={styles.stateWrap}>
          <EmptyState kind="loading" title="Agent 이력을 불러오는 중입니다" body="잠시만 기다려 주세요." />
        </div>
      )}

      {status === 'error' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="error"
            title="Agent 이력을 불러오지 못했습니다"
            body="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
          />
        </div>
      )}

      {status === 'empty' && (
        <div className={styles.stateWrap}>
          <EmptyState kind="empty" title="Agent 처리 이력이 없습니다" body="Agent가 업무를 처리하면 여기에 표시됩니다." />
        </div>
      )}

      {status === 'success' && (
        <>
          {visibleLogs.length === 0 ? (
            <div className={styles.stateWrap}>
              <EmptyState kind="empty" title="해당 근거의 이력이 없습니다" body="다른 필터로 다시 시도해 보세요." />
            </div>
          ) : (
            <div className={styles.list}>
              {visibleLogs.map((log) => (
                <ListRow key={log.id} columns="120px 1fr 140px 140px">
                  <span className={styles.time}>{log.time}</span>
                  <p className={styles.logDescription}>{log.description}</p>
                  <AgentSourceLabel source={log.source} />
                  <button
                    type="button"
                    className={styles.link}
                    onClick={() => handleOpenRelatedWork(log.relatedWorkId)}
                  >
                    관련 업무 보기 →
                  </button>
                </ListRow>
              ))}
            </div>
          )}

          <p className={styles.footerText}>
            {TOTAL_AGENT_LOG_COUNT}건 중 {visibleLogs.length}건 표시
          </p>
        </>
      )}
    </div>
  )
}
