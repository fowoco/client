import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchDocuments } from '../../api/documents'
import { fetchWorkerById } from '../../api/workers'
import { getErrorMessage } from '../../api/errors'
import { DetailRow } from '../../components/ui/DetailRow/DetailRow'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { WorkerFormModal } from '../../components/worker/WorkerFormModal'
import { useApiQuery } from '../../hooks/useApiQuery'
import { getDocumentViewModel } from '../../view-models/documentViewModel'
import { getOperationalDateViewModel } from '../../view-models/dateViewModel'
import { RegisterDocumentModal } from './overlays/RegisterDocumentModal'
import styles from './WorkerDetailPage.module.css'

export function WorkerDetailPage() {
  const { workerId } = useParams()

  const fetcher = useCallback(() => fetchWorkerById(workerId ?? ''), [workerId])
  const { status, data: worker, error, refetch } = useApiQuery(fetcher)

  const {
    data: documentPage,
    refetch: refetchDocuments,
  } = useApiQuery(useCallback(() => fetchDocuments({ workerId: workerId ?? '', size: 100 }), [workerId]))
  const workerDocuments = documentPage?.items ?? []

  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

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

  const stayExpiry = getOperationalDateViewModel('STAY_EXPIRY', worker.stay_expiry_date)
  const contractStart = getOperationalDateViewModel('CONTRACT_START', worker.contract_start_date)
  const contractEnd = getOperationalDateViewModel('CONTRACT_END', worker.contract_end_date)
  const employmentPermitEnd = getOperationalDateViewModel(
    'EMPLOYMENT_PERMIT_END',
    worker.employment_permit_end_date,
  )
  const employmentActivityEnd = getOperationalDateViewModel(
    'EMPLOYMENT_ACTIVITY_END',
    worker.employment_activity_end_date,
  )
  const visaType = worker.visa_type ?? '미등록'

  return (
    <div>
      <div className={styles.topBar}>
        <Link to={`/workers/${worker.worker_id}`} className={styles.back}>
          ← 근로자 목록
        </Link>
      </div>

      <div className={styles.headerRow}>
        <h1 className={styles.title}>{worker.display_name}</h1>
        {!stayExpiry.missing && stayExpiry.tone !== 'neutral' && (
          <StatusLabel tone={stayExpiry.tone}>{stayExpiry.relative} 체류만료</StatusLabel>
        )}
      </div>
      <p className={styles.meta}>
        {worker.nationality_code} · {visaType} | 연락처·사번 준비 중
      </p>

      <div className={styles.sectionCard}>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle}>기본정보</h2>
          <button type="button" className={styles.cardHeaderButton} onClick={() => setEditModalOpen(true)}>
            정보 수정
          </button>
        </div>
        <DetailRow label="국적" value={worker.nationality_code} />
        <DetailRow label="비자 유형" value={visaType} />
        {/* TODO(#48): worker_sensitive_data API 연동 후 사번·연락처 표시 */}
        <DetailRow label="사번" value="준비 중" />
        <DetailRow label="연락처" value="준비 중" />
        <DetailRow
          label={stayExpiry.label}
          value={stayExpiry.display}
          tone={stayExpiry.tone === 'critical' ? 'critical' : stayExpiry.tone === 'warning' ? 'warning' : 'default'}
        />
        <DetailRow label={contractStart.label} value={contractStart.display} />
        <DetailRow label={contractEnd.label} value={contractEnd.display} />
        <DetailRow label={employmentPermitEnd.label} value={employmentPermitEnd.display} />
        <DetailRow label={employmentActivityEnd.label} value={employmentActivityEnd.display} />
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle}>서류</h2>
          <button
            type="button"
            className={styles.cardHeaderButton}
            onClick={() => setRegisterModalOpen(true)}
          >
            ＋ 서류 등록
          </button>
        </div>
        {workerDocuments.length === 0 ? (
          <EmptyState kind="empty" title="제출된 서류가 없습니다" body="근로자가 서류를 제출하면 여기에 표시됩니다." />
        ) : (
          <div className={styles.documentList}>
            {workerDocuments.map((document) => {
              const view = getDocumentViewModel(document)
              return (
                <div key={view.id} className={styles.documentRow}>
                  <span className={styles.documentName}>{view.typeLabel}</span>
                  <StatusLabel tone={view.statusTone}>{view.statusLabel}</StatusLabel>
                  <span className={styles.documentUpdatedAt}>{view.expiry.display}</span>
                </div>
              )
            })}
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

      <RegisterDocumentModal
        open={registerModalOpen}
        workerId={worker.worker_id}
        onClose={() => setRegisterModalOpen(false)}
        onRegistered={refetchDocuments}
      />

      <WorkerFormModal
        open={editModalOpen}
        mode="edit"
        worker={worker}
        onClose={() => setEditModalOpen(false)}
        onSaved={refetch}
      />
    </div>
  )
}
