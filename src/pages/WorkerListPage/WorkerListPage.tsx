import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './WorkerListPage.module.css'
import { WORKERS } from './workerData'

export function WorkerListPage() {
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const visibleWorkers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return WORKERS
    return WORKERS.filter((worker) =>
      [worker.name, worker.nationality, worker.line].some((field) =>
        field.toLowerCase().includes(normalized),
      ),
    )
  }, [query])

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  return (
    <div>
      <div className={styles.header}>
        <button type="button" className={styles.registerButton}>
          근로자 등록
        </button>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.toolbarBox}>
          검색 :
          <input
            className={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름, 국적, 담당 라인으로 검색"
          />
        </label>
        <div className={styles.toolbarBox}>
          <button type="button" className={styles.filterButton}>
            필터
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {visibleWorkers.map((worker) => (
          <Link key={worker.id} to={`/workers/${worker.id}`} className={styles.card}>
            <label className={styles.checkboxLabel} onClick={(event) => event.stopPropagation()}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selectedIds.includes(worker.id)}
                onChange={() => toggleSelected(worker.id)}
              />
              선택
            </label>

            <div className={styles.info}>
              <span className={styles.name}>{worker.name}</span>
              <span className={styles.meta}>{worker.nationality}</span>
              <span className={styles.meta}>{worker.line}</span>
              <span className={styles.meta}>{worker.visaExpiry}</span>
              <span className={styles.meta}>서류 {worker.documentStatus}</span>
            </div>

            <span
              className={`${styles.status} ${
                worker.inspectionStatus === '양호' ? styles.statusOk : styles.statusWarn
              }`}
            >
              {worker.inspectionStatus}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
