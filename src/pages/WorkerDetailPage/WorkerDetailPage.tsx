import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchWorkerActivities, type WorkerActivityType } from '../../api/audit'
import { fetchDocuments } from '../../api/documents'
import { fetchTasks } from '../../api/tasks'
import { fetchWorkerById } from '../../api/workers'
import { getErrorMessage } from '../../api/errors'
import { DetailRow } from '../../components/ui/DetailRow/DetailRow'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { WorkerFormModal } from '../../components/worker/WorkerFormModal'
import { useApiQuery } from '../../hooks/useApiQuery'
import { TASK_STATUS_LABEL, TASK_STATUS_TONE } from '../../utils/taskStatus'
import { formatEventTime } from '../../utils/datetime'
import { getDocumentViewModel } from '../../view-models/documentViewModel'
import { getOperationalDateViewModel } from '../../view-models/dateViewModel'
import { RegisterDocumentModal } from './overlays/RegisterDocumentModal'
import { StayVerificationModal } from './overlays/StayVerificationModal'
import styles from './WorkerDetailPage.module.css'

const WORKER_ACTIVITY_LABEL: Record<WorkerActivityType, string> = {
  GUIDANCE_SENT: '안내 전송',
  GUIDANCE_OPENED: '근로자 확인',
  WORKER_RESPONSE_SUBMITTED: '근로자 응답',
  RESPONSE_REVIEWED: '담당자 확인',
}

export function WorkerDetailPage() {
  const { workerId } = useParams()

  const fetcher = useCallback(() => fetchWorkerById(workerId ?? ''), [workerId])
  const { status, data: worker, error, refetch } = useApiQuery(fetcher)

  const { data: documentPage, refetch: refetchDocuments } = useApiQuery(
    useCallback(() => fetchDocuments({ workerId: workerId ?? '', size: 100 }), [workerId]),
  )
  const workerDocuments = documentPage?.items ?? []

  const { data: taskPage } = useApiQuery(
    useCallback(() => fetchTasks({ workerId: workerId ?? '', size: 20 }), [workerId]),
  )
  const workerTasks = taskPage?.items ?? []

  const {
    status: activityStatus,
    data: activityPage,
    error: activityError,
    refetch: refetchActivities,
  } = useApiQuery(
    useCallback(() => fetchWorkerActivities(workerId ?? '', undefined, 20), [workerId]),
    useCallback((page: { items: unknown[] }) => page.items.length === 0, []),
  )
  const workerActivities = activityPage?.items ?? []

  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [stayVerificationOpen, setStayVerificationOpen] = useState(false)

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
          <StatusLabel tone={stayExpiry.tone}>
            {stayExpiry.expired
              ? `기록상 ${stayExpiry.relative} 경과 · 긴급 확인`
              : `${stayExpiry.relative} 체류만료`}
          </StatusLabel>
        )}
        {stayExpiry.expired && (
          <button
            type="button"
            className={styles.verificationButton}
            onClick={() => setStayVerificationOpen(true)}
          >
            체류상태 확인 시작
          </button>
        )}
      </div>
      <p className={styles.meta}>
        {worker.nationality_code} · {visaType} | 연락처·사번 준비 중
      </p>

      <div className={styles.sectionCard}>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle}>기본정보</h2>
          <button
            type="button"
            className={styles.cardHeaderButton}
            onClick={() => setEditModalOpen(true)}
          >
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
          tone={
            stayExpiry.tone === 'critical'
              ? 'critical'
              : stayExpiry.tone === 'warning'
                ? 'warning'
                : 'default'
          }
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
          <EmptyState
            kind="empty"
            title="제출된 서류가 없습니다"
            body="근로자가 서류를 제출하면 여기에 표시됩니다."
          />
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
        {activityStatus === 'loading' && (
          <EmptyState
            kind="loading"
            title="안내이력을 불러오는 중입니다"
            body="근로자에게 전달한 안내와 회신 기록을 확인하고 있습니다."
          />
        )}
        {activityStatus === 'error' && (
          <EmptyState
            kind="error"
            title="안내이력을 불러오지 못했습니다"
            body={activityError ? getErrorMessage(activityError) : '잠시 후 다시 시도해 주세요.'}
            actionLabel="다시 시도"
            onAction={refetchActivities}
          />
        )}
        {activityStatus === 'empty' && (
          <EmptyState
            kind="empty"
            title="안내이력이 없습니다"
            body="안내를 보내거나 근로자가 응답하면 시간순으로 표시됩니다."
          />
        )}
        {activityStatus === 'success' && (
          <ol className={styles.activityList}>
            {workerActivities.map((activity) => (
              <li key={activity.activity_id} className={styles.activityRow}>
                <div className={styles.activityMain}>
                  <span className={styles.activityType}>
                    {WORKER_ACTIVITY_LABEL[activity.type]}
                  </span>
                  <span className={styles.activitySummary}>{activity.summary}</span>
                  <Link to={`/tasks/${activity.task_id}`} className={styles.activityTaskLink}>
                    {activity.task_title}
                  </Link>
                </div>
                <time className={styles.activityTime} dateTime={activity.occurred_at}>
                  {formatEventTime(activity.occurred_at)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>현재 업무</h2>
        {workerTasks.length === 0 ? (
          <EmptyState
            kind="empty"
            title="진행 중인 업무가 없습니다"
            body="새 업무가 생기면 여기에 표시됩니다."
          />
        ) : (
          <div className={styles.documentList}>
            {workerTasks.map((task) => (
              <Link key={task.task_id} to={`/tasks/${task.task_id}`} className={styles.documentRow}>
                <span className={styles.documentName}>{task.title}</span>
                <StatusLabel tone={TASK_STATUS_TONE[task.status]}>
                  {TASK_STATUS_LABEL[task.status]}
                </StatusLabel>
                <span className={styles.documentUpdatedAt}>
                  {task.due_date ? `~${task.due_date}` : '기한 없음'}
                </span>
              </Link>
            ))}
          </div>
        )}
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

      <StayVerificationModal
        open={stayVerificationOpen}
        worker={worker}
        documents={workerDocuments}
        onClose={() => {
          setStayVerificationOpen(false)
          refetch()
          refetchDocuments()
        }}
        onRegisterEvidence={() => {
          setStayVerificationOpen(false)
          setRegisterModalOpen(true)
        }}
      />
    </div>
  )
}
