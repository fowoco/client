import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchCases, type CasePageResponse } from '../../api/cases'
import { getErrorMessage } from '../../api/errors'
import { fetchWorkers } from '../../api/workers'
import { Dropdown } from '../../components/ui/Dropdown/Dropdown'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { SearchInput } from '../../components/ui/SearchInput/SearchInput'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { WorkInboxDetail } from './WorkInboxDetail'
import { WorkInboxTargetList } from './WorkInboxTargetList'
import {
  buildWorkInboxModel,
  parseWorkInboxFocus,
  type WorkInboxFilter,
  type WorkInboxFocus,
  type WorkInboxSort,
} from './workInboxModel'
import styles from './WorkListPage.module.css'

const SORT_OPTIONS: { value: WorkInboxSort; label: string }[] = [
  { value: 'priority', label: '정렬 · 우선순위' },
  { value: 'due-date', label: '정렬 · 마감 임박순' },
  { value: 'worker-name', label: '정렬 · 근로자명' },
]

const FILTER_OPTIONS: { value: WorkInboxFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '진행 중' },
  { value: 'no-work', label: '업무 없음' },
]

const FOCUS_LABEL: Record<WorkInboxFocus, string> = {
  'pending-approval': '승인 대기',
  'due-today': '오늘 마감',
  'needs-info': '정보 보완',
  'worker-response': '응답 대기',
}

function isCasePageEmpty(page: CasePageResponse): boolean {
  return page.items.length === 0
}

export function WorkListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<WorkInboxSort>('priority')
  const [filter, setFilter] = useState<WorkInboxFilter>('all')
  const debouncedQuery = useDebouncedValue(query)
  const selectedWorkerId = searchParams.get('workerId')
  const focus = parseWorkInboxFocus(searchParams.get('focus'))

  const casesFetcher = useCallback(() => fetchCases({ size: 100 }), [])
  const workersFetcher = useCallback(() => fetchWorkers({ size: 100 }), [])

  const casesQuery = useApiQuery(casesFetcher, isCasePageEmpty)
  const workersQuery = useApiQuery(workersFetcher)

  const inbox = useMemo(
    () =>
      buildWorkInboxModel({
        cases: casesQuery.data?.items ?? [],
        workers: workersQuery.data?.items ?? [],
        query: debouncedQuery,
        selectedWorkerId,
        sort,
        filter,
        focus,
      }),
    [casesQuery.data, workersQuery.data, debouncedQuery, selectedWorkerId, sort, filter, focus],
  )

  const selectedGroup = inbox.selectedGroup
  const selectedGroupId = selectedGroup?.workerId ?? null

  useEffect(() => {
    if (
      !selectedGroupId ||
      selectedWorkerId === selectedGroupId
    ) {
      return
    }
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('workerId', selectedGroupId)
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, selectedGroupId, selectedWorkerId, setSearchParams])

  function handleSelectWorker(workerId: string) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('workerId', workerId)
    setSearchParams(nextParams)
  }

  function handleFilterChange(nextFilter: WorkInboxFilter) {
    setFilter(nextFilter)
    if (!focus) return
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('focus')
    setSearchParams(nextParams)
  }

  function handleClearFocus() {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('focus')
    setSearchParams(nextParams)
  }

  const hasCasePaginationCap =
    (casesQuery.data?.total_elements ?? 0) > (casesQuery.data?.items.length ?? 0)
  const hasWorkerPaginationCap =
    (workersQuery.data?.total_elements ?? 0) > (workersQuery.data?.items.length ?? 0)
  const capNotice = hasCasePaginationCap || hasWorkerPaginationCap
    ? '일부 데이터만 불러왔습니다. 검색·정렬·진행률은 현재 불러온 범위 기준입니다.'
    : null
  const isInitialLoading =
    (casesQuery.status === 'loading' && casesQuery.data === null) ||
    (inbox.allGroups.length === 0 && workersQuery.status === 'loading')
  const isBlockingError =
    inbox.allGroups.length === 0 &&
    casesQuery.status !== 'loading' &&
    workersQuery.status !== 'loading' &&
    (casesQuery.status === 'error' || workersQuery.status === 'error')
  const blockingError = casesQuery.error ?? workersQuery.error
  const isTrueEmpty =
    inbox.allGroups.length === 0 &&
    casesQuery.status !== 'loading' &&
    casesQuery.status !== 'error' &&
    workersQuery.status === 'success'
  const hasFilteredEmpty = inbox.allGroups.length > 0 && inbox.groups.length === 0

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.headline}>업무함</h1>
        <p className={styles.description}>근로자별 진행 업무 건과 지금 할 일을 확인합니다.</p>
      </header>

      <div className={styles.toolbar}>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="근로자·업무 건·지금 할 일 검색"
          ariaLabel="근로자·업무 건·지금 할 일 검색"
          className={styles.searchInput}
        />
        <div className={styles.toolbarControls}>
          <div className={styles.statusFilters} role="group" aria-label="업무 상태 필터">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.statusFilter} ${filter === option.value ? styles.statusFilterActive : ''}`}
                aria-pressed={filter === option.value}
                onClick={() => handleFilterChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Dropdown
            options={SORT_OPTIONS}
            value={sort}
            onChange={(value) => setSort(value as WorkInboxSort)}
            ariaLabel="업무함 정렬"
            className={styles.sortDropdown}
            width="133px"
          />
        </div>
      </div>

      {focus && (
        <div className={styles.focusNotice} role="status">
          <span><strong>{FOCUS_LABEL[focus]}</strong> 조건에 해당하는 업무만 표시합니다.</span>
          <button type="button" onClick={handleClearFocus}>전체 업무 보기</button>
        </div>
      )}

      {isInitialLoading && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="loading"
            title="근로자와 업무를 불러오는 중입니다"
            body="업무 우선순위를 정리하고 있습니다."
            note="처리 중 · 중복 실행 차단"
          />
        </div>
      )}

      {isBlockingError && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="error"
            title="업무함 정보를 불러오지 못했습니다"
            body={
              blockingError
                ? getErrorMessage(blockingError)
                : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
            }
            actionLabel="다시 시도"
            onAction={casesQuery.refetch}
          />
        </div>
      )}

      {isTrueEmpty && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="empty"
            title="등록된 근로자가 없습니다"
            body="근로자를 먼저 등록하면 업무 유무와 진행 상태를 한곳에서 확인할 수 있습니다."
            actionLabel="근로자 등록"
            onAction={() => navigate('/workers')}
          />
        </div>
      )}

      {hasFilteredEmpty && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="empty"
            title="검색 결과가 없습니다"
            body="검색어나 업무 상태 조건을 바꿔 다시 확인해 보세요."
          />
        </div>
      )}

      {selectedGroup && !isInitialLoading && (
        <>
          <div className={styles.noticeStack}>
            {casesQuery.status === 'error' && (
              <div className={styles.noticeWarning} role="status">
                <span>근로자 목록은 표시했지만 업무 정보를 갱신하지 못했습니다.</span>
                <button type="button" onClick={casesQuery.refetch}>
                  다시 시도
                </button>
              </div>
            )}
            {workersQuery.status === 'error' && (
              <p className={styles.notice} role="status">
                근로자 상세 정보를 불러오지 못해 Case에 저장된 이름으로 표시합니다.
              </p>
            )}
          </div>
          <div className={styles.workspace}>
            <WorkInboxTargetList
              groups={inbox.groups}
              selectedWorkerId={selectedGroup.workerId}
              totalCount={inbox.allGroups.length}
              capNotice={capNotice}
              onSelect={handleSelectWorker}
            />
            <WorkInboxDetail
              group={selectedGroup}
              onOpenTask={(taskId) => navigate(`/tasks/${taskId}`)}
              onOpenTaskContext={(taskId) => navigate(`/tasks/${taskId}?context=open`)}
              onCreateWork={(workerId, workerDisplayName) =>
                navigate('/tasks/new', {
                  state: {
                    prefill: `${workerDisplayName} 근로자의 업무를 준비해 주세요`,
                    workerId,
                  },
                })
              }
              onOpenWorker={(workerId) => navigate(`/workers/${workerId}/detail`)}
              onOpenDocuments={(workerId) => navigate(`/documents?workerId=${workerId}`)}
              casesUnavailable={casesQuery.status === 'error'}
            />
          </div>
          <p className={styles.srOnly} aria-live="polite">
            {selectedGroup.workerDisplayName}의 업무 상세를 표시했습니다.
          </p>
        </>
      )}
    </div>
  )
}
