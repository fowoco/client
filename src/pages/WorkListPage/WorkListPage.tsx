import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../../api/errors'
import { fetchTasks, type TaskStatus, type TaskSummaryResponse } from '../../api/tasks'
import { fetchWorkflowCatalog } from '../../api/workflows'
import { Dropdown } from '../../components/ui/Dropdown/Dropdown'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { SearchInput } from '../../components/ui/SearchInput/SearchInput'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import { WorkItemRow, type WorkItemUrgency } from '../../components/ui/WorkItemRow/WorkItemRow'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { TASK_STATUS_LABEL, TASK_STATUS_NEXT_ACTION } from '../../utils/taskStatus'
import { daysUntil, getUrgencyTier } from '../../utils/urgency'
import styles from './WorkListPage.module.css'

const URGENCY_TIER_ROW_CLASS: Record<ReturnType<typeof getUrgencyTier>, WorkItemUrgency> = {
  urgent: 'critical',
  medium: 'warning',
  comfortable: 'neutral',
}

type TabId = 'all' | 'needs-review' | 'follow-up'

// 서버 Task API에는 담당자·승인자 개념이 없고(#153 조사 결과), 목록 조회(TaskSummaryResponse)에는
// created_by조차 내려오지 않아 '내 업무' 탭은 근사할 데이터가 아예 없다. '내가 승인할 업무'는
// 상태 기반 '검토 필요' 탭으로 대체했다.
const WORK_TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'needs-review', label: '검토 필요' },
  { id: 'follow-up', label: '후속조치' },
]

const STATUS_OPTIONS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: '상태 · 전체' },
  { value: 'READY_FOR_REVIEW', label: '상태 · 검토 필요' },
  { value: 'WAITING_WORKER', label: '상태 · 근로자 응답 대기' },
]

const DUE_OPTIONS = [
  { value: '7', label: '마감 · 7일' },
  { value: '30', label: '마감 · 30일' },
  { value: '90', label: '마감 · 90일' },
]

const PRIORITY_COUNT = 5

function matchesTab(item: TaskSummaryResponse, tabId: TabId): boolean {
  if (tabId === 'all') return true
  if (tabId === 'needs-review') return item.status === 'READY_FOR_REVIEW'
  return item.status === 'WAITING_WORKER' || item.status === 'WAITING_EXTERNAL'
}

export function WorkListPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [dueFilter, setDueFilter] = useState('30')
  const [showAll, setShowAll] = useState(false)
  const debouncedQuery = useDebouncedValue(query)

  // keyword는 서버가 지원하는 검색 파라미터라 그대로 넘긴다. 나머지(탭·상태·마감)는 받아온
  // 한 페이지(최대 100건) 안에서 클라이언트가 필터링한다.
  const tasksFetcher = useCallback(
    () => fetchTasks({ keyword: debouncedQuery.trim() || undefined, size: 100 }),
    [debouncedQuery],
  )
  const { status, data, error, refetch } = useApiQuery(
    tasksFetcher,
    useCallback((page: { items: TaskSummaryResponse[] }) => page.items.length === 0, []),
  )

  // 카테고리 라벨(workflow 이름)을 붙이기 위한 조회 — 실패해도 목록 자체는 그대로 보여준다.
  const { data: catalog } = useApiQuery(useCallback(() => fetchWorkflowCatalog(), []))
  const workflowNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const workflow of catalog?.workflows ?? []) map.set(workflow.workflow_id, workflow.name)
    return map
  }, [catalog])

  const isDefaultView = activeTab === 'all' && debouncedQuery.trim() === '' && statusFilter === 'all' && dueFilter === '30'

  const filteredItems = useMemo(() => {
    const items = data?.items ?? []
    return items.filter((item) => {
      const dueDays = daysUntil(item.due_date)
      const matchesTabFilter = matchesTab(item, activeTab)
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesDue = dueDays === null || dueDays <= Number(dueFilter)
      return matchesTabFilter && matchesStatus && matchesDue
    })
  }, [data, activeTab, statusFilter, dueFilter])

  const visibleItems = isDefaultView && !showAll ? filteredItems.slice(0, PRIORITY_COUNT) : filteredItems

  const tabsWithCounts = useMemo(
    () =>
      WORK_TABS.map((tab) => ({
        ...tab,
        count: (data?.items ?? []).filter((item) => matchesTab(item, tab.id)).length,
      })),
    [data],
  )

  function handleViewAll() {
    setShowAll(true)
  }

  return (
    <div>
      <h1 className={styles.headline}>먼저 처리할 5건을 다음 행동 순서로 정리했습니다.</h1>
      <p className={styles.description}>
        근로자와 연결되지 않은 내부 사무업무도 같은 업무 구조로 표시됩니다.
      </p>

      <Tabs tabs={tabsWithCounts} activeId={activeTab} onChange={(id) => setActiveTab(id as TabId)} ariaLabel="업무함 탭" />

      <div className={styles.toolbar}>
        <SearchInput value={query} onChange={setQuery} placeholder="업무명 검색" ariaLabel="업무 검색" />
        <Dropdown
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as TaskStatus | 'all')}
          ariaLabel="상태 필터"
        />
        <Dropdown options={DUE_OPTIONS} value={dueFilter} onChange={setDueFilter} ariaLabel="마감 필터" />
      </div>

      {status === 'loading' && (
        <div className={styles.stateWrap}>
          <EmptyState kind="loading" title="업무 목록을 불러오는 중입니다" body="잠시만 기다려 주세요." />
        </div>
      )}

      {status === 'error' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="error"
            title="업무 목록을 불러오지 못했습니다"
            body={error ? getErrorMessage(error) : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'}
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
          <div className={styles.columnHeader}>
            <span>업무</span>
            <span>다음 행동</span>
          </div>

          {data && data.total_elements > data.items.length && (
            <p className={styles.capNotice}>
              전체 {data.total_elements}개 중 {data.items.length}개만 불러왔습니다. 찾는 업무가 안 보이면 검색어를
              바꿔보세요.
            </p>
          )}

          {visibleItems.length === 0 ? (
            <div className={styles.stateWrap}>
              <EmptyState kind="empty" title="표시할 업무가 없습니다" body="다른 탭이나 필터로 다시 시도해 보세요." />
            </div>
          ) : (
            <div className={styles.list}>
              {visibleItems.map((item) => {
                const dueDays = daysUntil(item.due_date)
                const dueLabel = dueDays === null ? '마감일 없음' : dueDays <= 0 ? '오늘' : `D-${dueDays}`
                const workflowName = workflowNameById.get(item.workflow_id) ?? item.workflow_id
                return (
                  <WorkItemRow
                    key={item.task_id}
                    title={item.title}
                    meta={`${dueLabel} · ${TASK_STATUS_LABEL[item.status]} · ${workflowName}`}
                    nextAction={TASK_STATUS_NEXT_ACTION[item.status]}
                    urgency={URGENCY_TIER_ROW_CLASS[getUrgencyTier(dueDays)]}
                    onClick={() => navigate(`/tasks/${item.task_id}`)}
                  />
                )
              })}
            </div>
          )}

          <div className={styles.footer}>
            <span className={styles.footerText}>
              {isDefaultView && !showAll
                ? `${data?.total_elements ?? filteredItems.length}개 중 우선 업무 ${visibleItems.length}개 표시`
                : `${data?.total_elements ?? filteredItems.length}개 중 ${visibleItems.length}개 표시`}
            </span>
            {isDefaultView && !showAll && filteredItems.length > PRIORITY_COUNT && (
              <button type="button" className={styles.footerLink} onClick={handleViewAll}>
                전체 업무 보기 →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
