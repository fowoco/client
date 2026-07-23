import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useToastStore } from '../../store/toastStore'
import { DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_TONE, DOCUMENTS, type DocumentStatus } from '../DocumentListPage/documentListData'
import { WORKERS } from '../WorkerListPage/workerListData'
import styles from './DocumentDetailPage.module.css'

export function DocumentDetailPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)

  const document = DOCUMENTS.find((item) => item.id === documentId) ?? DOCUMENTS[0]
  const [status, setStatus] = useState<DocumentStatus>(document.status)

  // TODO(backend): GET /api/documents/:id -> 근로자·업무 연결 정보를 서버에서 직접 내려받도록 대체
  const relatedWorker = WORKERS.find((worker) => worker.name === document.workerName)
  const relatedCaseId = relatedWorker?.currentTasks[0]?.caseId ?? null

  function handleApprove() {
    // TODO(backend): PATCH /api/documents/:id { status: 'done' }
    setStatus('done')
    showToast('서류를 확인 완료 처리했습니다.')
  }

  function handleReject() {
    // TODO(backend): PATCH /api/documents/:id { status: 'missing' } -> 근로자에게 재제출 안내 발송
    setStatus('missing')
    showToast('서류를 반려했습니다. 근로자에게 재제출을 요청하세요.')
  }

  return (
    <div>
      <div className={styles.topBar}>
        <Link to="/documents" className={styles.back}>
          ← 서류
        </Link>
      </div>

      <div className={styles.headerRow}>
        <h1 className={styles.title}>{document.docType}</h1>
        <StatusLabel tone={DOCUMENT_STATUS_TONE[status]}>{DOCUMENT_STATUS_LABEL[status]}</StatusLabel>
      </div>
      <p className={styles.meta}>
        {document.workerName} · 제출일 {document.submittedAt}
      </p>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>첨부 미리보기</h2>
        {/* TODO(backend): GET /api/documents/:id/file -> 실제 첨부 파일 미리보기로 대체 */}
        <div className={styles.previewBox}>
          <p className={styles.previewFileName}>{document.docType}.pdf</p>
          <p className={styles.previewNote}>미리보기는 백엔드 연동 후 제공됩니다.</p>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>관련 근로자·업무</h2>
        {relatedWorker ? (
          <div className={styles.relatedLinks}>
            <button
              type="button"
              className={styles.relatedLink}
              onClick={() => navigate(`/workers/${relatedWorker.id}`)}
            >
              {relatedWorker.name} 근로자 정보 →
            </button>
            {relatedCaseId && (
              <button
                type="button"
                className={styles.relatedLink}
                onClick={() => navigate(`/tasks/${relatedCaseId}`)}
              >
                연결된 업무 열기 →
              </button>
            )}
          </div>
        ) : (
          <EmptyState kind="empty" title="연결된 근로자를 찾을 수 없습니다" body="근로자 목록에서 이름을 확인해 주세요." />
        )}
      </div>

      <div className={styles.actionDock}>
        <Button variant="secondary" onClick={handleReject} disabled={status === 'missing'}>
          반려
        </Button>
        <Button onClick={handleApprove} disabled={status === 'done'}>
          확인 완료 처리
        </Button>
      </div>
    </div>
  )
}
