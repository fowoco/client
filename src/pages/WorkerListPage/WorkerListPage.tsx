import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchWorkers, type WorkerResponse } from '../../api/workers'
import { getErrorMessage } from '../../api/errors'
import { Dropdown } from '../../components/ui/Dropdown/Dropdown'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { SearchInput } from '../../components/ui/SearchInput/SearchInput'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { daysUntil, getUrgencyTier, URGENCY_TONE } from '../../utils/urgency'
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

const PRIORITY_COUNT = 5

// 제품이 E-9(비전문취업) 근로자를 대상으로 하는 만큼 비자 유형은 항상 E-9다.
// WorkerResponse에는 별도 visa_type 필드가 없다.
const VISA_TYPE = 'E-9'

function deadlineLabel(deadlineDays: number | null): string {
  if (deadlineDays === null) return '정상'
  return `D-${deadlineDays} 체류만료`
}

function toRow(worker: WorkerResponse) {
  const deadlineDays = daysUntil(worker.stay_expiry_date)
  return { worker, deadlineDays, label: deadlineLabel(deadlineDays) }
}

export function WorkerListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { workerId } = useParams()
  const [query, setQuery] = useState('')
  const [deadlineFilter, setDeadlineFilter] = useState('90')
  const [showAll, setShowAll] = useState(false)
  const debouncedQuery = useDebouncedValue(query)

  // 서버 GET /api/v1/workers에는 자유 텍스트 검색 파라미터가 없어, 한 페이지(최대 100건)를
  // 받아온 뒤 클라이언트에서 검색·기한 필터링한다. 근로자가 100명을 넘으면 이후 페이지는
  // 아직 반영되지 않는다.
  const fetcher = useCallback(() => fetchWorkers({ size: 100 }), [])
  const isEmpty = useCallback((data: { items: WorkerResponse[] }) => data.items.length === 0, [])
  const { status, data, error, refetch } = useApiQuery(fetcher, isEmpty)

  const rows = useMemo(() => {
    const items = data?.items ?? []
    return items
      .map(toRow)
      .sort((a, b) => (a.deadlineDays ?? Infinity) - (b.deadlineDays ?? Infinity))
  }, [data])

  const isDefaultView = debouncedQuery.trim() === '' && deadlineFilter === '90'

  const filteredRows = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesQuery =
        !normalized || row.worker.display_name.toLowerCase().includes(normalized)
      const matchesDeadline = row.deadlineDays === null || row.deadlineDays <= Number(deadlineFilter)
      return matchesQuery && matchesDeadline
    })
  }, [rows, debouncedQuery, deadlineFilter])

  const visibleRows = isDefaultView && !showAll ? filteredRows.slice(0, PRIORITY_COUNT) : filteredRows

  const selectedRow = rows.find((row) => row.worker.worker_id === workerId) ?? rows[0]
  const selectedDeadlineTier = selectedRow ? getUrgencyTier(selectedRow.deadlineDays) : 'comfortable'

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
          options={DEADLINE_OPTIONS}
          value={deadlineFilter}
          onChange={setDeadlineFilter}
          ariaLabel="기한 필터"
        />
        <span className={styles.maskingNote}>개인정보 마스킹 켜짐</span>
      </div>

      {status === 'loading' && (
        <div className={styles.stateWrap}>
          <EmptyState kind="loading" title="근로자 목록을 불러오는 중입니다" body="잠시만 기다려 주세요." />
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

            <h3 className={styles.sectionTitle}>현재 업무</h3>
            {/* TODO(#153): Task API 연동 후 실제 진행 업무로 대체 */}
            <p className={styles.emptyTasks}>업무 연동 준비 중입니다.</p>

            <hr className={styles.divider} />

            <h3 className={styles.sectionTitle}>최근 Timeline</h3>
            {/* TODO(#156): Audit API 연동 후 실제 활동 이력으로 대체 */}
            <p className={styles.emptyTasks}>활동 이력 연동 준비 중입니다.</p>

            <button type="button" className={styles.moreLink} onClick={handleShowMoreDetail}>
              기본정보·서류·안내이력 더 보기 ▾
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
