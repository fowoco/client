import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchTaskActivities } from '../../api/audit'
import { getErrorMessage } from '../../api/errors'
import { fetchTasks, type TaskSummaryResponse } from '../../api/tasks'
import { fetchWorkers, type WorkerResponse } from '../../api/workers'
import { Button } from '../../components/ui/Button/Button'
import { DetailRow } from '../../components/ui/DetailRow/DetailRow'
import { Dropdown } from '../../components/ui/Dropdown/Dropdown'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { SearchInput } from '../../components/ui/SearchInput/SearchInput'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { AUDIT_ACTION_LABEL } from '../../utils/auditLabels'
import { formatEventTime } from '../../utils/datetime'
import { TASK_STATUS_LABEL, TASK_STATUS_NEXT_ACTION } from '../../utils/taskStatus'
import { daysUntil, getUrgencyTier, URGENCY_TONE } from '../../utils/urgency'
import { getOperationalDateViewModel } from '../../view-models/dateViewModel'
import styles from './WorkerListPage.module.css'

const DEADLINE_TIER_CLASS = {
  urgent: styles.workerDeadlineUrgent,
  medium: styles.workerDeadlineMedium,
  comfortable: styles.workerDeadlineComfortable,
}

const DEADLINE_OPTIONS = [
  { value: '30', label: '기한 · 30일' },
  { value: '60', label: '기한 · 60일' },
  { value: '90', label: '기한 · 90일' },
]

type WorkerStatusFilter = 'all' | 'needs-review' | 'ai-suggested' | 'done'

const STATUS_FILTER_OPTIONS: { value: WorkerStatusFilter; label: string }[] = [
  { value: 'all', label: '상태 · 전체' },
  { value: 'needs-review', label: '상태 · 확인 필요' },
  { value: 'ai-suggested', label: '상태 · AI 추천' },
  { value: 'done', label: '상태 · 완료' },
]

function computeWorkerStatus(tasks: TaskSummaryResponse[]): Exclude<WorkerStatusFilter, 'all'> {
  if (tasks.some((task) => task.status === 'READY_FOR_REVIEW' || task.status === 'WAITING_WORKER' || task.status === 'WAITING_EXTERNAL')) {
    return 'needs-review'
  }
  if (tasks.some((task) => task.status === 'DRAFT' || task.status === 'NEEDS_INFO')) return 'ai-suggested'
  return 'done'
}

function blockerFor(task: TaskSummaryResponse | null): string {
  if (!task) return '차단 요인 없음'
  if (task.status === 'WAITING_WORKER') return '근로자 응답 대기'
  if (task.status === 'WAITING_EXTERNAL') return '외부기관 응답 대기'
  if (task.status === 'READY_FOR_REVIEW') return '담당자 승인 대기'
  if (task.status === 'NEEDS_INFO') return '정보 보완 필요'
  return '차단 요인 없음'
}

function etaFor(task: TaskSummaryResponse | null): string {
  if (!task) return '해당 없음'
  const days = daysUntil(task.due_date)
  if (days === null) return '마감일 미지정'
  if (days <= 0) return '오늘 처리 필요'
  return `D-${days} 이내 처리 예정`
}

const PRIORITY_COUNT = 5

// 제품이 E-9(비전문취업) 근로자를 대상으로 하는 만큼 비자 유형은 항상 E-9다.
// WorkerResponse에는 별도 visa_type 필드가 없다.
const VISA_TYPE = 'E-9'

function toRow(worker: WorkerResponse) {
  const deadlineDays = daysUntil(worker.stay_expiry_date)
  const expiry = getOperationalDateViewModel('STAY_EXPIRY', worker.stay_expiry_date)
  const label = expiry.missing ? expiry.display : `${expiry.relative} 체류만료`
  return { worker, deadlineDays, label }
}

export function WorkerListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { workerId } = useParams()
  const [query, setQuery] = useState('')
  const [deadlineFilter, setDeadlineFilter] = useState('90')
  const [statusFilter, setStatusFilter] = useState<WorkerStatusFilter>('all')
  const [showAll, setShowAll] = useState(false)
  const debouncedQuery = useDebouncedValue(query)

  // 서버 GET /api/v1/workers에는 자유 텍스트 검색 파라미터가 없어, 한 페이지(최대 100건)를
  // 받아온 뒤 클라이언트에서 검색·기한 필터링한다. 근로자가 100명을 넘으면 이후 페이지는
  // 아직 반영되지 않는다.
  const fetcher = useCallback(() => fetchWorkers({ size: 100 }), [])
  const isEmpty = useCallback((data: { items: WorkerResponse[] }) => data.items.length === 0, [])
  const { status, data, error, refetch } = useApiQuery(fetcher, isEmpty)

  // 근로자별 현재 업무·AI 추천 카드·상태 필터를 위해 업무 목록을 한 번에 받아 worker_id로 묶는다.
  const tasksFetcher = useCallback(() => fetchTasks({ size: 100 }), [])
  const { data: taskPage } = useApiQuery(tasksFetcher)
  const tasksByWorker = useMemo(() => {
    const map = new Map<string, TaskSummaryResponse[]>()
    for (const task of taskPage?.items ?? []) {
      const list = map.get(task.worker_id) ?? []
      list.push(task)
      map.set(task.worker_id, list)
    }
    return map
  }, [taskPage])

  const rows = useMemo(() => {
    const items = data?.items ?? []
    return items
      .map(toRow)
      .sort((a, b) => (a.deadlineDays ?? Infinity) - (b.deadlineDays ?? Infinity))
  }, [data])

  const isDefaultView = debouncedQuery.trim() === '' && deadlineFilter === '90' && statusFilter === 'all'

  const filteredRows = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesQuery =
        !normalized || row.worker.display_name.toLowerCase().includes(normalized)
      const matchesDeadline = row.deadlineDays === null || row.deadlineDays <= Number(deadlineFilter)
      const matchesStatus =
        statusFilter === 'all' ||
        computeWorkerStatus(tasksByWorker.get(row.worker.worker_id) ?? []) === statusFilter
      return matchesQuery && matchesDeadline && matchesStatus
    })
  }, [rows, debouncedQuery, deadlineFilter, statusFilter, tasksByWorker])

  const visibleRows = isDefaultView && !showAll ? filteredRows.slice(0, PRIORITY_COUNT) : filteredRows

  const selectedRow = rows.find((row) => row.worker.worker_id === workerId) ?? rows[0]
  const selectedDeadlineTier = selectedRow ? getUrgencyTier(selectedRow.deadlineDays) : 'comfortable'

  const selectedWorkerTasks = selectedRow ? tasksByWorker.get(selectedRow.worker.worker_id) ?? [] : []
  const draftTask = selectedWorkerTasks.find((task) => task.status === 'DRAFT') ?? null
  const waitingTask =
    selectedWorkerTasks.find((task) => task.status === 'WAITING_WORKER' || task.status === 'WAITING_EXTERNAL') ?? null
  const primaryTask =
    selectedWorkerTasks.find((task) => task.status === 'READY_FOR_REVIEW') ??
    draftTask ??
    waitingTask ??
    selectedWorkerTasks[0] ??
    null

  const activitiesFetcher = useCallback(
    () => (primaryTask ? fetchTaskActivities(primaryTask.task_id) : Promise.resolve([])),
    [primaryTask],
  )
  const { data: activities } = useApiQuery(activitiesFetcher)

  function handleViewAllWorkers() {
    setShowAll(true)
  }

  function handleShowMoreDetail() {
    if (!selectedRow) return
    navigate(`/workers/${selectedRow.worker.worker_id}/detail`)
  }

  return (
    <div>
      <h1 className={styles.headline}>체류·서류 확인이 필요한 근로자 {visibleRows.length}명</h1>
      <p className={styles.description}>
        기한과 진행 중인 업무를 먼저 보여주며, 개인정보는 필요한 범위에서만 확인합니다.
      </p>

      <div className={styles.toolbar}>
        <SearchInput value={query} onChange={setQuery} placeholder="이름 검색" ariaLabel="근로자 검색" />
        <Dropdown
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as WorkerStatusFilter)}
          ariaLabel="상태 필터"
        />
        <Dropdown
          options={DEADLINE_OPTIONS}
          value={deadlineFilter}
          onChange={setDeadlineFilter}
          ariaLabel="기한 필터"
        />
        <span className={styles.maskingNote}>개인정보 마스킹 켜짐</span>
      </div>

      {status === 'loading' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="loading"
            title="근로자 목록을 불러오는 중입니다"
            body="잠시만 기다려 주세요."
            note="처리 중 · 중복 실행 차단"
          />
        </div>
      )}

      {status === 'error' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="error"
            title="근로자 목록을 불러오지 못했습니다"
            body={error ? getErrorMessage(error) : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'}
            actionLabel="다시 시도"
            onAction={refetch}
          />
        </div>
      )}

      {status === 'empty' && (
        <div className={styles.stateWrap}>
          <EmptyState kind="empty" title="등록된 근로자가 없습니다" body="근로자를 등록하면 여기에 표시됩니다." />
        </div>
      )}

      {status === 'success' && selectedRow && (
        <div className={styles.workspace}>
          <div className={styles.listPanel}>
            <p className={styles.listHeader}>근로자 {data?.total_elements ?? rows.length}명</p>
            {data && data.total_elements > data.items.length && (
              <p className={styles.capNotice}>
                전체 {data.total_elements}명 중 {data.items.length}명만 불러왔습니다. 찾는 근로자가 안 보이면
                검색어를 바꿔보세요.
              </p>
            )}

            {visibleRows.length === 0 ? (
              <div className={styles.searchEmpty}>
                <EmptyState
                  kind="empty"
                  title="표시할 근로자가 없습니다"
                  body="다른 검색어나 기한 필터로 다시 시도해 보세요."
                />
              </div>
            ) : (
              visibleRows.map((row) => (
                <button
                  key={row.worker.worker_id}
                  type="button"
                  className={`${styles.workerRow} ${
                    row.worker.worker_id === selectedRow.worker.worker_id ? styles.workerRowActive : ''
                  }`}
                  onClick={() =>
                    navigate({ pathname: `/workers/${row.worker.worker_id}`, search: location.search })
                  }
                >
                  <div className={styles.workerRowTop}>
                    <p className={styles.workerName}>{row.worker.display_name}</p>
                    <span
                      className={`${styles.workerDeadline} ${
                        DEADLINE_TIER_CLASS[getUrgencyTier(row.deadlineDays)]
                      }`}
                    >
                      {row.label}
                    </span>
                  </div>
                  <p className={styles.workerMeta}>
                    {row.worker.nationality_code} · {VISA_TYPE}
                  </p>
                </button>
              ))
            )}

            {isDefaultView && !showAll && filteredRows.length > PRIORITY_COUNT && (
              <button type="button" className={styles.viewAll} onClick={handleViewAllWorkers}>
                전체 근로자 보기 →
              </button>
            )}
          </div>

          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <h2 className={styles.detailName}>{selectedRow.worker.display_name}</h2>
              {selectedDeadlineTier !== 'comfortable' && (
                <StatusLabel tone={URGENCY_TONE[selectedDeadlineTier]}>{selectedRow.label}</StatusLabel>
              )}
            </div>
            <p className={styles.detailMeta}>
              {selectedRow.worker.nationality_code} · {VISA_TYPE} | 연락처·사번 준비 중
            </p>

            <hr className={styles.divider} />

            {(draftTask || waitingTask) && (
              <>
                <p className={styles.aiRecommendHeadline}>
                  ✦ AI 추천 · {selectedRow.label}, 확인이 필요합니다.
                </p>
                <div className={styles.aiCardList}>
                  {draftTask && (
                    <div className={styles.aiCard}>
                      <div>
                        <p className={styles.aiCardTitle}>{draftTask.title}</p>
                        <p className={styles.aiCardMeta}>AI 준비 완료 · HR 검토 필요</p>
                      </div>
                      <Button onClick={() => navigate(`/tasks/${draftTask.task_id}`)}>초안 검토</Button>
                    </div>
                  )}
                  {waitingTask && (
                    <div className={styles.aiCard}>
                      <div>
                        <p className={styles.aiCardTitle}>{waitingTask.title}</p>
                        <p className={styles.aiCardMeta}>근로자 응답 대기 · HR 확인</p>
                      </div>
                      <Button variant="secondary" onClick={() => navigate(`/tasks/${waitingTask.task_id}`)}>
                        문서 확인
                      </Button>
                    </div>
                  )}
                </div>
                <hr className={styles.divider} />
              </>
            )}

            <h3 className={styles.sectionTitle}>현재 업무</h3>
            {selectedWorkerTasks.length === 0 ? (
              <p className={styles.emptyTasks}>진행 중인 업무가 없습니다.</p>
            ) : (
              <div className={styles.currentTaskList}>
                {selectedWorkerTasks.map((task) => (
                  <button
                    key={task.task_id}
                    type="button"
                    className={styles.currentTaskRow}
                    onClick={() => navigate(`/tasks/${task.task_id}`)}
                  >
                    <span className={styles.currentTaskTitle}>{task.title}</span>
                    <span className={styles.currentTaskStatus}>{TASK_STATUS_LABEL[task.status]}</span>
                  </button>
                ))}
              </div>
            )}

            <hr className={styles.divider} />

            <h3 className={styles.sectionTitle}>의사결정 요약</h3>
            <DetailRow
              label="다음 행동"
              value={primaryTask ? TASK_STATUS_NEXT_ACTION[primaryTask.status] : '확인할 업무 없음'}
            />
            <DetailRow label="차단 요인" value={blockerFor(primaryTask)} />
            <DetailRow label="완료 예상" value={etaFor(primaryTask)} />
            <DetailRow label="판단 근거" value="보유 데이터 · 등록된 처리 절차 기준" />

            <hr className={styles.divider} />

            <h3 className={styles.sectionTitle}>최근 Timeline</h3>
            {!activities || activities.length === 0 ? (
              <p className={styles.emptyTasks}>활동 이력이 없습니다.</p>
            ) : (
              <div className={styles.timeline}>
                {activities.slice(0, 5).map((event) => (
                  <div key={event.audit_event_id} className={styles.timelineRow}>
                    <span className={styles.timelineDate}>{formatEventTime(event.created_at)}</span>
                    <span className={styles.timelineLabel}>
                      {event.change_summary ?? AUDIT_ACTION_LABEL[event.action]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button type="button" className={styles.moreLink} onClick={handleShowMoreDetail}>
              기본정보·서류·안내이력 더 보기 ▾
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
