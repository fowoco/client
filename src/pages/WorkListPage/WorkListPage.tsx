import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getErrorMessage } from '../../api/errors'
import { fetchTasks, type TaskPageResponse } from '../../api/tasks'
import { fetchWorkers, type WorkerPageResponse, type WorkerResponse } from '../../api/workers'
import { fetchWorkflowCatalog } from '../../api/workflows'
import { Dropdown } from '../../components/ui/Dropdown/Dropdown'
import { EmptyState, type EmptyStateKind } from '../../components/ui/EmptyState/EmptyState'
import { SearchInput } from '../../components/ui/SearchInput/SearchInput'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
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

function isWorkerPageEmpty(page: WorkerPageResponse): boolean {
  return page.items.length === 0
}

function isTaskPageEmpty(page: TaskPageResponse): boolean {
  return page.items.length === 0
}

interface TaskStateWorkspaceProps {
  workers: readonly WorkerResponse[]
  selectedWorkerId: string | null
  query: string
  kind: Extract<EmptyStateKind, 'loading' | 'error'>
  title: string
  body: string
  onSelect: (workerId: string) => void
  onRetry?: () => void
}

function TaskStateWorkspace({
  workers,
  selectedWorkerId,
  query,
  kind,
  title,
  body,
  onSelect,
  onRetry,
}: TaskStateWorkspaceProps) {
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR')
  const visibleWorkers = workers.filter(
    (worker) =>
      !normalizedQuery || worker.display_name.toLocaleLowerCase('ko-KR').includes(normalizedQuery),
  )
  const resolvedWorkerId =
    visibleWorkers.find((worker) => worker.worker_id === selectedWorkerId)?.worker_id ??
    visibleWorkers[0]?.worker_id ??
    null

  return (
    <div className={styles.workspace} aria-busy={kind === 'loading'}>
      <section className={styles.listPanel} aria-labelledby="work-inbox-list-title">
        <div className={styles.listHeader}>
          <h2 id="work-inbox-list-title" className={styles.listTitle}>
            근로자 {workers.length}명
          </h2>
        </div>
        <div className={styles.targetList} role="listbox" aria-label="업무 대상 근로자">
          {visibleWorkers.map((worker) => {
            const selected = worker.worker_id === resolvedWorkerId
            return (
              <button
                key={worker.worker_id}
                type="button"
                role="option"
                aria-selected={selected}
                className={`${styles.targetOption} ${selected ? styles.targetOptionSelected : ''}`}
                onClick={() => onSelect(worker.worker_id)}
              >
                <span className={styles.targetOptionTop}>
                  <span className={styles.targetName}>{worker.display_name}</span>
                  <StatusLabel tone={kind === 'error' ? 'critical' : 'neutral'}>
                    {kind === 'error' ? '조회 실패' : '확인 중'}
                  </StatusLabel>
                </span>
                <span className={styles.targetMeta}>
                  국적 코드 {worker.nationality_code} · 업무 상태 미확인
                </span>
              </button>
            )
          })}
        </div>
      </section>
      <section className={styles.detailState} aria-label="업무 조회 상태">
        <EmptyState
          kind={kind}
          title={title}
          body={body}
          note={kind === 'loading' ? '처리 중 · 중복 실행 차단' : undefined}
          actionLabel={kind === 'error' ? '다시 시도' : undefined}
          onAction={kind === 'error' ? onRetry : undefined}
        />
      </section>
    </div>
  )
}

export function WorkListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<WorkInboxSort>('priority')
  const debouncedQuery = useDebouncedValue(query)
  const selectedWorkerId = searchParams.get('workerId')

  const workersFetcher = useCallback(() => fetchWorkers({ size: 100 }), [])
  const tasksFetcher = useCallback(() => fetchTasks({ size: 100 }), [])
  const catalogFetcher = useCallback(() => fetchWorkflowCatalog(), [])

  const workersQuery = useApiQuery(workersFetcher, isWorkerPageEmpty)
  const tasksQuery = useApiQuery(tasksFetcher, isTaskPageEmpty)
  const catalogQuery = useApiQuery(catalogFetcher)

  const workflowNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const workflow of catalogQuery.data?.workflows ?? []) {
      map.set(workflow.workflow_id, workflow.name)
    }
    return map
  }, [catalogQuery.data])

  const inbox = useMemo(
    () =>
      buildWorkInboxModel({
        workers: workersQuery.data?.items ?? [],
        tasks: tasksQuery.data?.items ?? [],
        workflowNameById,
        query: debouncedQuery,
        selectedWorkerId,
        sort,
      }),
    [workersQuery.data, tasksQuery.data, workflowNameById, debouncedQuery, selectedWorkerId, sort],
  )

  const selectedGroup = inbox.selectedGroup
  const selectedGroupId = selectedGroup?.worker.worker_id ?? null

  useEffect(() => {
    if (
      tasksQuery.status !== 'success' ||
      !selectedGroupId ||
      selectedWorkerId === selectedGroupId
    ) {
      return
    }
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('workerId', selectedGroupId)
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, selectedGroupId, selectedWorkerId, setSearchParams, tasksQuery.status])

  function handleSelectWorker(workerId: string) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('workerId', workerId)
    setSearchParams(nextParams)
  }

  function handleRetryAll() {
    workersQuery.refetch()
    tasksQuery.refetch()
    catalogQuery.refetch()
  }

  const hasPaginationCap =
    (workersQuery.data?.total_elements ?? 0) > (workersQuery.data?.items.length ?? 0) ||
    (tasksQuery.data?.total_elements ?? 0) > (tasksQuery.data?.items.length ?? 0)
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

      {workersQuery.status === 'loading' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="loading"
            title="근로자와 업무를 불러오는 중입니다"
            body="업무 우선순위를 정리하고 있습니다."
            note="처리 중 · 중복 실행 차단"
          />
        </div>
      )}

      {workersQuery.status === 'error' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="error"
            title="근로자 정보를 불러오지 못했습니다"
            body={
              workersQuery.error
                ? getErrorMessage(workersQuery.error)
                : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
            }
            actionLabel="다시 시도"
            onAction={handleRetryAll}
          />
        </div>
      )}

      {workersQuery.status === 'empty' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="empty"
            title="등록된 근로자가 없습니다"
            body="근로자를 등록하고 업무를 연결하면 이곳에서 확인할 수 있습니다."
          />
        </div>
      )}

      {workersQuery.status === 'success' && tasksQuery.status === 'loading' && (
        <TaskStateWorkspace
          workers={workersQuery.data?.items ?? []}
          selectedWorkerId={selectedWorkerId}
          query={debouncedQuery}
          kind="loading"
          title="연결된 업무를 불러오는 중입니다"
          body="근로자 정보는 불러왔으며 업무 상태를 확인하고 있습니다."
          onSelect={handleSelectWorker}
        />
      )}

      {workersQuery.status === 'success' && tasksQuery.status === 'error' && (
        <TaskStateWorkspace
          workers={workersQuery.data?.items ?? []}
          selectedWorkerId={selectedWorkerId}
          query={debouncedQuery}
          kind="error"
          title="연결된 업무를 불러오지 못했습니다"
          body={
            tasksQuery.error
              ? getErrorMessage(tasksQuery.error)
              : '근로자 정보는 유지했습니다. 업무 조회를 다시 시도해 주세요.'
          }
          onSelect={handleSelectWorker}
          onRetry={tasksQuery.refetch}
        />
      )}

      {workersQuery.status === 'success' && tasksQuery.status === 'empty' && (
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

      {workersQuery.status === 'success' &&
        tasksQuery.status === 'success' &&
        inbox.allGroups.length === 0 && (
          <div className={styles.stateWrap}>
            <EmptyState
              kind="error"
              title="업무와 근로자 정보를 연결하지 못했습니다"
              body="업무에 연결된 근로자 정보를 확인한 뒤 다시 시도해 주세요."
              actionLabel="다시 시도"
              onAction={handleRetryAll}
            />
          </div>
        )}

      {workersQuery.status === 'success' &&
        tasksQuery.status === 'success' &&
        inbox.allGroups.length > 0 &&
        inbox.groups.length === 0 && (
          <div className={styles.stateWrap}>
            <EmptyState
              kind="empty"
              title="검색 결과가 없습니다"
              body="다른 근로자명, Case 또는 업무명으로 다시 검색해 보세요."
            />
          </div>
        )}

      {workersQuery.status === 'success' && tasksQuery.status === 'success' && selectedGroup && (
        <>
          <div className={styles.noticeStack} aria-live="polite">
            {catalogQuery.status === 'error' && (
              <p className={styles.notice}>
                업무 분류 이름을 불러오지 못해 업무 유형으로 표시합니다.
              </p>
            )}
            {inbox.orphanTasks.length > 0 && (
              <p className={styles.noticeWarning}>
                근로자 정보를 확인할 수 없는 업무 {inbox.orphanTasks.length}건은 목록에서
                제외했습니다.
              </p>
            )}
          </div>
          <div className={styles.workspace}>
            <WorkInboxTargetList
              groups={inbox.groups}
              selectedWorkerId={selectedGroup.worker.worker_id}
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
            {selectedGroup.worker.display_name}의 업무 상세를 표시했습니다.
          </p>
        </>
      )}
    </div>
  )
}
