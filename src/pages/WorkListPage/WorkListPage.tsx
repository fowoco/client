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
import { buildWorkInboxModel, type WorkInboxSort } from './workInboxModel'
import styles from './WorkListPage.module.css'

const SORT_OPTIONS: { value: WorkInboxSort; label: string }[] = [
  { value: 'priority', label: '정렬 · 우선순위' },
  { value: 'due-date', label: '정렬 · 마감 임박순' },
  { value: 'worker-name', label: '정렬 · 근로자명' },
]

function isCasePageEmpty(page: CasePageResponse): boolean {
  return page.items.length === 0
}

export function WorkListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<WorkInboxSort>('priority')
  const debouncedQuery = useDebouncedValue(query)
  const selectedWorkerId = searchParams.get('workerId')

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
      }),
    [casesQuery.data, workersQuery.data, debouncedQuery, selectedWorkerId, sort],
  )

  const selectedGroup = inbox.selectedGroup
  const selectedGroupId = selectedGroup?.workerId ?? null

  useEffect(() => {
    if (
      casesQuery.status !== 'success' ||
      !selectedGroupId ||
      selectedWorkerId === selectedGroupId
    ) {
      return
    }
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('workerId', selectedGroupId)
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, selectedGroupId, selectedWorkerId, setSearchParams, casesQuery.status])

  function handleSelectWorker(workerId: string) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('workerId', workerId)
    setSearchParams(nextParams)
  }

  const hasPaginationCap =
    (casesQuery.data?.total_elements ?? 0) > (casesQuery.data?.items.length ?? 0)
  const capNotice = hasPaginationCap
    ? '일부 데이터만 불러왔습니다. 검색·정렬·진행률은 현재 불러온 범위 기준입니다.'
    : null

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
        <Dropdown
          options={SORT_OPTIONS}
          value={sort}
          onChange={(value) => setSort(value as WorkInboxSort)}
          ariaLabel="업무함 정렬"
          className={styles.sortDropdown}
          width="133px"
        />
      </div>

      {casesQuery.status === 'loading' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="loading"
            title="근로자와 업무를 불러오는 중입니다"
            body="업무 우선순위를 정리하고 있습니다."
            note="처리 중 · 중복 실행 차단"
          />
        </div>
      )}

      {casesQuery.status === 'error' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="error"
            title="업무 정보를 불러오지 못했습니다"
            body={
              casesQuery.error
                ? getErrorMessage(casesQuery.error)
                : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
            }
            actionLabel="다시 시도"
            onAction={casesQuery.refetch}
          />
        </div>
      )}

      {casesQuery.status === 'empty' && (
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

      {casesQuery.status === 'success' && inbox.groups.length === 0 && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="empty"
            title="검색 결과가 없습니다"
            body="다른 근로자명, Case 또는 업무명으로 다시 검색해 보세요."
          />
        </div>
      )}

      {casesQuery.status === 'success' && selectedGroup && (
        <>
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
