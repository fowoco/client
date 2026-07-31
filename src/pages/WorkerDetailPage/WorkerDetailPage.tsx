import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchDocuments } from '../../api/documents'
import { fetchWorkerById } from '../../api/workers'
import { getErrorMessage } from '../../api/errors'
import { DetailRow } from '../../components/ui/DetailRow/DetailRow'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useApiQuery } from '../../hooks/useApiQuery'
import { DOCUMENT_TYPE_LABEL, SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_TONE } from '../../utils/documentLabels'
import { daysUntil, getUrgencyTier, URGENCY_TONE } from '../../utils/urgency'
import styles from './WorkerDetailPage.module.css'

// 제품이 E-9(비전문취업) 근로자를 대상으로 하는 만큼 비자 유형은 항상 E-9다.
const VISA_TYPE = 'E-9'

export function WorkerDetailPage() {
  const { workerId } = useParams()

  const fetcher = useCallback(() => fetchWorkerById(workerId ?? ''), [workerId])
  const { status, data: worker, error, refetch } = useApiQuery(fetcher)

  const { data: documentPage } = useApiQuery(
    useCallback(() => fetchDocuments({ workerId: workerId ?? '', size: 100 }), [workerId]),
  )
  const workerDocuments = documentPage?.items ?? []

  if (status === 'loading') {
    return (
      <div className={styles.stateWrap}>
        <EmptyState
          kind="loading"
          title="근로자 정보를 불러오는 중입니다"
          body="잠시만 기다려 주세요."
          note="처리 중 · 중복 실행 차단"
        />
      </div>
    )
  }

  if (status === 'error' || !worker) {
    return (
      <div className={styles.stateWrap}>
        <EmptyState
          kind="error"
          title="근로자 정보를 불러오지 못했습니다"
          body={error ? getErrorMessage(error) : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'}
          actionLabel="다시 시도"
          onAction={refetch}
        />
      </div>
    )
  }

  const deadlineDays = daysUntil(worker.stay_expiry_date)
  const deadlineLabel = deadlineDays === null ? '정상' : `D-${deadlineDays} 체류만료`
  const deadlineTier = getUrgencyTier(deadlineDays)

  return (
    <div>
      <div className={styles.topBar}>
        <Link to={`/workers/${worker.worker_id}`} className={styles.back}>
          ← 근로자 목록
        </Link>
      </div>

      <div className={styles.headerRow}>
        <h1 className={styles.title}>{worker.display_name}</h1>
        {deadlineTier !== 'comfortable' && (
          <StatusLabel tone={URGENCY_TONE[deadlineTier]}>{deadlineLabel}</StatusLabel>
        )}
      </div>
      <p className={styles.meta}>
        {worker.nationality_code} · {VISA_TYPE} | 연락처·사번 준비 중
      </p>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>기본정보</h2>
        <DetailRow label="국적" value={worker.nationality_code} />
        <DetailRow label="비자 유형" value={VISA_TYPE} />
        {/* TODO(#48): worker_sensitive_data API 연동 후 사번·연락처 표시 */}
        <DetailRow label="사번" value="준비 중" />
        <DetailRow label="연락처" value="준비 중" />
        <DetailRow
          label="체류 상태"
          value={deadlineLabel}
          tone={deadlineTier === 'urgent' ? 'critical' : deadlineTier === 'medium' ? 'warning' : 'default'}
        />
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>서류</h2>
        {workerDocuments.length === 0 ? (
          <EmptyState kind="empty" title="제출된 서류가 없습니다" body="근로자가 서류를 제출하면 여기에 표시됩니다." />
        ) : (
          <div className={styles.documentList}>
            {workerDocuments.map((document) => (
              <div key={document.worker_document_id} className={styles.documentRow}>
                <span className={styles.documentName}>{DOCUMENT_TYPE_LABEL[document.document_type]}</span>
                <StatusLabel tone={SUBMISSION_STATUS_TONE[document.submission_status]}>
                  {SUBMISSION_STATUS_LABEL[document.submission_status]}
                </StatusLabel>
                <span className={styles.documentUpdatedAt}>{document.expiry_date ?? '없음'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>안내이력</h2>
        {/* TODO(#156): Audit API 연동 후 실제 활동 이력으로 대체 */}
        <EmptyState kind="empty" title="안내이력 연동 준비 중입니다" body="Audit API 연동 후 표시됩니다." />
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>현재 업무</h2>
        {/* TODO(#153): Task API 연동 후 실제 진행 업무로 대체 */}
        <EmptyState kind="empty" title="업무 연동 준비 중입니다" body="Task API 연동 후 표시됩니다." />
      </div>
    </div>
  )
}
