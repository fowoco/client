import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dropdown } from '../../components/ui/Dropdown/Dropdown'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { WorkItemRow, type WorkItemUrgency } from '../../components/ui/WorkItemRow/WorkItemRow'
import { useAsyncDemoData } from '../../hooks/useAsyncDemoData'
import { getUrgencyTier } from '../../utils/urgency'
import styles from './WorkListPage.module.css'
import { TOTAL_WORK_COUNT, WORK_ITEMS, WORK_TABS, type WorkTabId } from './workListData'

const URGENCY_TIER_ROW_CLASS: Record<ReturnType<typeof getUrgencyTier>, WorkItemUrgency> = {
  urgent: 'critical',
  medium: 'warning',
  comfortable: 'neutral',
}

const STATUS_OPTIONS = [
  { value: 'all', label: '상태 · 전체' },
  { value: 'pending', label: '상태 · 승인 대기' },
  { value: 'waiting-response', label: '상태 · 응답 대기' },
]

const DUE_OPTIONS = [
  { value: '7', label: '마감 · 7일' },
  { value: '30', label: '마감 · 30일' },
  { value: '90', label: '마감 · 90일' },
]

export function WorkListPage() {
  const navigate = useNavigate()
  const status = useAsyncDemoData(WORK_ITEMS.length === 0)
  const [activeTab, setActiveTab] = useState(WORK_TABS[0].id)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dueFilter, setDueFilter] = useState('30')

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return WORK_ITEMS.filter((item) => {
      const matchesQuery = !normalized || item.title.toLowerCase().includes(normalized)
      const matchesTab = activeTab === 'all' || item.tabIds.includes(activeTab as WorkTabId)
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesDue = item.dueDays <= Number(dueFilter)
      return matchesQuery && matchesTab && matchesStatus && matchesDue
    })
  }, [query, activeTab, statusFilter, dueFilter])

  function handleAdvancedFilter() {
    // TODO(backend): GET /api/work-items/filters -> 고급 필터 옵션 목록
  }

  function handleViewAll() {
    // TODO(backend): GET /api/work-items?tab=&page= -> 전체 업무 페이지네이션
  }

  return (
    <div>
      <h1 className={styles.headline}>먼저 처리할 5건을 다음 행동 순서로 정리했습니다.</h1>
      <p className={styles.description}>
        근로자와 연결되지 않은 내부 사무업무도 같은 업무 구조로 표시됩니다.
      </p>

      <div className={styles.tabs} role="tablist" aria-label="업무함 탭">
        {WORK_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label} {tab.count}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="업무명·대상·담당자 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="업무 검색"
        />
        {/* TODO(backend): GET /api/work-items?status= -> 현재는 클라이언트에서 status로 필터링, 추후 서버 쿼리로 대체 */}
        <Dropdown
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          ariaLabel="상태 필터"
        />
        {/* TODO(backend): GET /api/work-items?due= -> 현재는 클라이언트에서 dueDays로 필터링, 추후 서버 쿼리로 대체 */}
        <Dropdown
          options={DUE_OPTIONS}
          value={dueFilter}
          onChange={setDueFilter}
          ariaLabel="마감 필터"
        />
        <button type="button" className={styles.advancedFilter} onClick={handleAdvancedFilter}>
          고급 필터 7개 ▾
        </button>
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
            body="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
            actionLabel="다시 시도"
            onAction={() => navigate('/tasks', { replace: true })}
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

          {visibleItems.length === 0 ? (
            <div className={styles.stateWrap}>
              <EmptyState
                kind="empty"
                title="표시할 업무가 없습니다"
                body="다른 탭이나 필터로 다시 시도해 보세요."
              />
            </div>
          ) : (
            <div className={styles.list}>
              {visibleItems.map((item) => (
                <WorkItemRow
                  key={item.id}
                  title={item.title}
                  meta={item.meta}
                  nextAction={item.nextAction}
                  urgency={URGENCY_TIER_ROW_CLASS[getUrgencyTier(item.dueDays)]}
                  onClick={() => navigate(`/tasks/${item.id}`)}
                />
              ))}
            </div>
          )}

          <div className={styles.footer}>
            <span className={styles.footerText}>
              {TOTAL_WORK_COUNT}개 중 우선 업무 {WORK_ITEMS.length}개 표시
            </span>
            <button type="button" className={styles.footerLink} onClick={handleViewAll}>
              전체 업무 보기 →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
