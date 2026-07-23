import { Link, useNavigate, useParams } from 'react-router-dom'
import { DetailRow } from '../../components/ui/DetailRow/DetailRow'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_TONE, DOCUMENTS } from '../DocumentListPage/documentListData'
import { getUrgencyTier, URGENCY_TONE } from '../../utils/urgency'
import styles from './WorkerDetailPage.module.css'
import { WORKERS } from '../WorkerListPage/workerListData'

export function WorkerDetailPage() {
  const { workerId } = useParams()
  const navigate = useNavigate()

  const worker = WORKERS.find((item) => item.id === workerId) ?? WORKERS[0]
  const deadlineTier = getUrgencyTier(worker.deadlineDays)
  // TODO(backend): GET /api/documents?workerId= -> 근로자 기준 서류 목록으로 대체 (현재는 이름으로 매칭)
  const workerDocuments = DOCUMENTS.filter((document) => document.workerName === worker.name)

  function handleOpenTask(caseId: string) {
    navigate(`/tasks/${caseId}`)
  }

  return (
    <div>
      <div className={styles.topBar}>
        <Link to={`/workers/${worker.id}`} className={styles.back}>
          ← 근로자 목록
        </Link>
      </div>

      <div className={styles.headerRow}>
        <h1 className={styles.title}>{worker.name}</h1>
        {deadlineTier !== 'comfortable' && (
          <StatusLabel tone={URGENCY_TONE[deadlineTier]}>{worker.deadlineLabel}</StatusLabel>
        )}
      </div>
      <p className={styles.meta}>
        {worker.nationality} · {worker.visaType} · {worker.employeeId} | 연락처 {worker.phone}
      </p>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>기본정보</h2>
        <DetailRow label="국적" value={worker.nationality} />
        <DetailRow label="비자 유형" value={worker.visaType} />
        <DetailRow label="사번" value={worker.employeeId} />
        <DetailRow label="연락처" value={worker.phone} />
        <DetailRow
          label="체류 상태"
          value={worker.deadlineLabel}
          tone={deadlineTier === 'urgent' ? 'critical' : deadlineTier === 'medium' ? 'warning' : 'default'}
        />
        <DetailRow label="비고" value={worker.note} />
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>서류</h2>
        {workerDocuments.length === 0 ? (
          <EmptyState kind="empty" title="제출된 서류가 없습니다" body="근로자가 서류를 제출하면 여기에 표시됩니다." />
        ) : (
          <div className={styles.documentList}>
            {workerDocuments.map((document) => (
              <div key={document.id} className={styles.documentRow}>
                <span className={styles.documentName}>{document.docType}</span>
                <StatusLabel tone={DOCUMENT_STATUS_TONE[document.status]}>
                  {DOCUMENT_STATUS_LABEL[document.status]}
                </StatusLabel>
                <span className={styles.documentUpdatedAt}>{document.submittedAt}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>안내이력</h2>
        {worker.timeline.length === 0 ? (
          <EmptyState kind="empty" title="발송된 안내가 없습니다" body="근로자에게 안내가 발송되면 여기에 표시됩니다." />
        ) : (
          <div className={styles.noticeList}>
            {worker.timeline.map((entry) => (
              <div key={`${entry.date}-${entry.label}`} className={styles.noticeRow}>
                <span className={styles.noticeDate}>{entry.date}</span>
                <span className={styles.noticeChannel}>시스템 알림</span>
                <p className={styles.noticeLabel}>{entry.label}</p>
                <StatusLabel tone={entry.highlighted ? 'warning' : 'success'}>
                  {entry.highlighted ? '응답 대기' : '확인됨'}
                </StatusLabel>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>현재 업무</h2>
        {worker.currentTasks.length === 0 ? (
          <EmptyState kind="empty" title="진행 중인 업무가 없습니다" body="새 업무가 배정되면 여기에 표시됩니다." />
        ) : (
          <div className={styles.taskList}>
            {worker.currentTasks.map((task) => (
              <div key={task.caseId} className={styles.taskRow}>
                <div>
                  <p className={styles.taskTitle}>{task.title}</p>
                  <p className={styles.taskDetail}>{task.detail}</p>
                </div>
                <button type="button" className={styles.taskLink} onClick={() => handleOpenTask(task.caseId)}>
                  열기 →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
