import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAuditEvents, type ActorType, type AuditEventResponse } from '../../api/audit'
import { getErrorMessage } from '../../api/errors'
import { AgentSourceLabel } from '../../components/ui/AgentSourceLabel/AgentSourceLabel'
import { Dropdown } from '../../components/ui/Dropdown/Dropdown'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ListRow } from '../../components/ui/ListRow/ListRow'
import { useApiQuery } from '../../hooks/useApiQuery'
import { ACTOR_TYPE_TO_AGENT_SOURCE, AUDIT_ACTION_LABEL } from '../../utils/auditLabels'
import { formatEventTime } from '../../utils/datetime'
import styles from './AgentLogPage.module.css'

const PERIOD_OPTIONS = [
  { value: 'today', label: '기간 · 오늘' },
  { value: '7', label: '기간 · 7일' },
  { value: '30', label: '기간 · 30일' },
  { value: 'all', label: '기간 · 전체' },
]

// 실제 ActorType(4종)에는 데모의 '보유 데이터'(data)에 대응하는 값이 없다(#156 조사 결과).
const SOURCE_OPTIONS: { value: ActorType | 'all'; label: string }[] = [
  { value: 'all', label: '근거 · 전체' },
  { value: 'SYSTEM_RULE', label: '근거 · 등록된 규칙' },
  { value: 'AI_AGENT', label: '근거 · Agent 초안' },
  { value: 'HR_USER', label: '근거 · HR 확인' },
  { value: 'WORKER_LINK', label: '근거 · 근로자 응답' },
]

function periodToCreatedFrom(period: string): string | undefined {
  const now = new Date()
  if (period === 'today') {
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    return startOfToday.toISOString()
  }
  if (period === '7' || period === '30') {
    const from = new Date(now)
    from.setDate(from.getDate() - Number(period))
    return from.toISOString()
  }
  return undefined
}

export function AgentLogPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('all')
  const [source, setSource] = useState<ActorType | 'all'>('all')

  const fetcher = useCallback(
    () =>
      fetchAuditEvents({
        actorType: source === 'all' ? undefined : source,
        createdFrom: periodToCreatedFrom(period),
        limit: 100,
      }),
    [period, source],
  )
  const { status, data, error, refetch } = useApiQuery(
    fetcher,
    useCallback((page: { items: AuditEventResponse[] }) => page.items.length === 0, []),
  )
  const logs = data?.items ?? []

  function handleOpenRelatedWork(taskId: string) {
    navigate(`/tasks/${taskId}`)
  }

  return (
    <div>
      <h1 className={styles.headline}>Agent가 처리한 업무 이력</h1>
      <p className={styles.description}>
        Agent가 어떤 근거로 판단했는지 시간순으로 확인하고, 관련 업무로 바로 이동할 수 있습니다.
      </p>

      <div className={styles.toolbar}>
        <Dropdown options={PERIOD_OPTIONS} value={period} onChange={setPeriod} ariaLabel="기간 필터" />
        <Dropdown
          options={SOURCE_OPTIONS}
          value={source}
          onChange={(value) => setSource(value as ActorType | 'all')}
          ariaLabel="근거 출처 필터"
        />
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
            body={error ? getErrorMessage(error) : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'}
            actionLabel="다시 시도"
            onAction={refetch}
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
          {logs.length === 0 ? (
            <div className={styles.stateWrap}>
              <EmptyState kind="empty" title="해당 근거의 이력이 없습니다" body="다른 필터로 다시 시도해 보세요." />
            </div>
          ) : (
            <div className={styles.list}>
              {logs.map((log) => (
                <ListRow key={log.audit_event_id} columns="120px 1fr 140px 140px">
                  <span className={styles.time}>{formatEventTime(log.created_at)}</span>
                  <p className={styles.logDescription}>{log.change_summary ?? AUDIT_ACTION_LABEL[log.action]}</p>
                  <AgentSourceLabel source={ACTOR_TYPE_TO_AGENT_SOURCE[log.actor_type]} />
                  {log.target_type === 'TASK' ? (
                    <button
                      type="button"
                      className={styles.link}
                      onClick={() => handleOpenRelatedWork(log.target_id)}
                    >
                      관련 업무 보기 →
                    </button>
                  ) : (
                    <span />
                  )}
                </ListRow>
              ))}
            </div>
          )}

          <p className={styles.footerText}>{logs.length}건 표시</p>
        </>
      )}
    </div>
  )
}
