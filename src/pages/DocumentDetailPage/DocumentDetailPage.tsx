import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchDocuments, type SubmissionStatus } from '../../api/documents'
import { getErrorMessage } from '../../api/errors'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useToastStore } from '../../store/toastStore'
import { DOCUMENT_TYPE_LABEL, SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_TONE } from '../../utils/documentLabels'
import styles from './DocumentDetailPage.module.css'

export function DocumentDetailPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)

  // GET /api/v1/documents/{id} 단건 조회가 없어서(#57 조사 결과), 목록을 통째로 받아
  // worker_document_id로 찾는다.
  const { status: fetchStatus, data, error, refetch } = useApiQuery(useCallback(() => fetchDocuments({ size: 100 }), []))
  const document = data?.items.find((item) => item.worker_document_id === documentId) ?? null

  const [localStatus, setLocalStatus] = useState<SubmissionStatus | null>(null)

  if (fetchStatus === 'loading') {
    return (
      <div className={styles.stateWrap}>
        <EmptyState kind="loading" title="서류 정보를 불러오는 중입니다" body="잠시만 기다려 주세요." />
      </div>
    )
  }

  if (fetchStatus === 'error') {
    return (
      <div className={styles.stateWrap}>
        <EmptyState
          kind="error"
          title="서류 정보를 불러오지 못했습니다"
          body={error ? getErrorMessage(error) : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'}
          actionLabel="다시 시도"
          onAction={refetch}
        />
      </div>
    )
  }

  if (!document) {
    return (
      <div className={styles.stateWrap}>
        <EmptyState kind="empty" title="서류를 찾을 수 없습니다" body="서류 목록에서 다시 확인해 주세요." />
      </div>
    )
  }

  const status = localStatus ?? document.submission_status

  // TODO(backend): PATCH /api/v1/workers/{workerId}/documents/{id}에는 expected_version이
  // 필요한데, 목록 응답(DocumentItemResponse)에 version 필드가 없어 안전하게 호출할 수
  // 없다 (#57 조사 결과 — 서버에 문의 필요). 그때까지 확인/반려는 화면에서만 반영한다.
  function handleApprove() {
    setLocalStatus('VERIFIED')
    showToast('서류를 확인 완료 처리했습니다.')
  }

  function handleReject() {
    setLocalStatus('MISSING')
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
        <h1 className={styles.title}>{DOCUMENT_TYPE_LABEL[document.document_type]}</h1>
        <StatusLabel tone={SUBMISSION_STATUS_TONE[status]}>{SUBMISSION_STATUS_LABEL[status]}</StatusLabel>
      </div>
      <p className={styles.meta}>
        {document.display_name ?? '알 수 없음'} · 만료일 {document.expiry_date ?? '없음'}
      </p>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>첨부 미리보기</h2>
        {/* TODO(backend): file_id로 실제 파일을 내려받는 API가 아직 없음 */}
        <div className={styles.previewBox}>
          <p className={styles.previewFileName}>{DOCUMENT_TYPE_LABEL[document.document_type]}</p>
          <p className={styles.previewNote}>미리보기는 백엔드 연동 후 제공됩니다.</p>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>관련 근로자</h2>
        <div className={styles.relatedLinks}>
          <button
            type="button"
            className={styles.relatedLink}
            onClick={() => navigate(`/workers/${document.worker_id}`)}
          >
            {document.display_name ?? '근로자'} 정보 →
          </button>
        </div>
      </div>

      <div className={styles.actionDock}>
        <Button variant="secondary" onClick={handleReject} disabled={status === 'MISSING'}>
          반려
        </Button>
        <Button onClick={handleApprove} disabled={status === 'VERIFIED'}>
          확인 완료 처리
        </Button>
      </div>
    </div>
  )
}
