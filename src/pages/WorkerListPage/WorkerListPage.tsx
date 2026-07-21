import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { useAsyncDemoData } from '../../hooks/useAsyncDemoData'
import styles from './WorkerListPage.module.css'
import { TOTAL_WORKER_COUNT, WORKERS } from './workerListData'

const TASK_LINK_CLASS = {
  warning: styles.taskLinkWarning,
  primary: styles.taskLinkPrimary,
}

export function WorkerListPage() {
  const navigate = useNavigate()
  const status = useAsyncDemoData(WORKERS.length === 0)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(WORKERS[0].id)

  const visibleWorkers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return WORKERS
    return WORKERS.filter((worker) =>
      [worker.name, worker.nationality, worker.employeeId].some((field) =>
        field.toLowerCase().includes(normalized),
      ),
    )
  }, [query])

  const selectedWorker = WORKERS.find((worker) => worker.id === selectedId) ?? WORKERS[0]

  function handleViewAllWorkers() {
    // TODO(backend): GET /api/workers?page= -> 전체 근로자 페이지네이션
  }

  function handleOpenTask() {
    // TODO(backend): GET /api/work-items/:id -> 해당 업무 상세로 이동
  }

  function handleShowMoreDetail() {
    // TODO(backend): GET /api/workers/:id/full -> 기본정보·서류·안내이력 상세
  }

  return (
    <div>
      <h1 className={styles.headline}>체류·서류 확인이 필요한 근로자 {WORKERS.length}명</h1>
      <p className={styles.description}>
        기한과 진행 중인 업무를 먼저 보여주며, 개인정보는 필요한 범위에서만 확인합니다.
      </p>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="이름·사번·국적 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="근로자 검색"
        />
        <select className={styles.filter} aria-label="기한 필터" defaultValue="90">
          <option value="90">기한 · 90일</option>
        </select>
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
            body="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
            actionLabel="다시 시도"
            onAction={() => navigate('/workers', { replace: true })}
          />
        </div>
      )}

      {status === 'empty' && (
        <div className={styles.stateWrap}>
          <EmptyState kind="empty" title="등록된 근로자가 없습니다" body="근로자를 등록하면 여기에 표시됩니다." />
        </div>
      )}

      {status === 'success' && (
        <div className={styles.workspace}>
          <div className={styles.listPanel}>
            <p className={styles.listHeader}>근로자 {TOTAL_WORKER_COUNT}명</p>

            {visibleWorkers.length === 0 ? (
              <div className={styles.searchEmpty}>
                <EmptyState kind="empty" title="검색 결과가 없습니다" body="다른 검색어로 다시 시도해 보세요." />
              </div>
            ) : (
              visibleWorkers.map((worker) => (
                <button
                  key={worker.id}
                  type="button"
                  className={`${styles.workerRow} ${
                    worker.id === selectedId ? styles.workerRowActive : ''
                  }`}
                  onClick={() => setSelectedId(worker.id)}
                >
                  <div className={styles.workerRowTop}>
                    <p className={styles.workerName}>{worker.name}</p>
                    <span
                      className={`${styles.workerDeadline} ${
                        worker.deadlineHighlighted ? '' : styles.workerDeadlineNormal
                      }`}
                    >
                      {worker.deadlineLabel}
                    </span>
                  </div>
                  <p className={styles.workerMeta}>
                    {worker.nationality} · {worker.visaType} · 사번 {worker.employeeId}
                  </p>
                  <p className={styles.workerNote}>{worker.note}</p>
                </button>
              ))
            )}

            <button type="button" className={styles.viewAll} onClick={handleViewAllWorkers}>
              전체 근로자 보기 →
            </button>
          </div>

          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <h2 className={styles.detailName}>{selectedWorker.name}</h2>
              {selectedWorker.deadlineHighlighted && (
                <span className={styles.visaBadge}>{selectedWorker.deadlineLabel}</span>
              )}
            </div>
            <p className={styles.detailMeta}>
              {selectedWorker.nationality} · {selectedWorker.visaType} ·{' '}
              {selectedWorker.employeeId} | 연락처 {selectedWorker.phone}
            </p>

            <hr className={styles.divider} />

            <h3 className={styles.sectionTitle}>현재 업무</h3>
            {selectedWorker.currentTasks.length === 0 ? (
              <p className={styles.emptyTasks}>진행 중인 업무가 없습니다.</p>
            ) : (
              <div className={styles.taskList}>
                {selectedWorker.currentTasks.map((task) => (
                  <div key={task.title} className={styles.taskRow}>
                    <div>
                      <p className={styles.taskTitle}>{task.title}</p>
                      <p className={styles.taskDetail}>{task.detail}</p>
                    </div>
                    <button
                      type="button"
                      className={`${styles.taskLink} ${TASK_LINK_CLASS[task.linkTone]}`}
                      onClick={handleOpenTask}
                    >
                      열기 →
                    </button>
                  </div>
                ))}
              </div>
            )}

            <hr className={styles.divider} />

            <h3 className={styles.sectionTitle}>최근 Timeline</h3>
            <div className={styles.timeline}>
              {selectedWorker.timeline.map((entry) => (
                <div key={`${entry.date}-${entry.label}`} className={styles.timelineRow}>
                  <span className={styles.timelineDate}>{entry.date}</span>
                  <span
                    className={`${styles.timelineDot} ${
                      entry.highlighted ? styles.timelineDotHighlighted : ''
                    }`}
                  />
                  <span className={styles.timelineLabel}>{entry.label}</span>
                </div>
              ))}
            </div>

            <button type="button" className={styles.moreLink} onClick={handleShowMoreDetail}>
              기본정보·서류·안내이력 더 보기 ▾
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
