import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchDocuments } from '../../api/documents'
import { getErrorMessage } from '../../api/errors'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useApiQuery } from '../../hooks/useApiQuery'
import { getDocumentViewModel } from '../../view-models/documentViewModel'
import styles from './DocumentDetailPage.module.css'

export function DocumentDetailPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()

  // GET /api/v1/documents/{id} 단건 조회가 없어서(#57 조사 결과), 목록을 통째로 받아
  // worker_document_id로 찾는다.
  const { status: fetchStatus, data, error, refetch } = useApiQuery(useCallback(() => fetchDocuments({ size: 100 }), []))
  const document = data?.items.find((item) => item.worker_document_id === documentId) ?? null

  if (fetchStatus === 'loading') {
    return (
      <div className={styles.stateWrap}>
        <EmptyState
          kind="loading"
          title="서류 정보를 불러오는 중입니다"
          body="잠시만 기다려 주세요."
          note="처리 중 · 중복 실행 차단"
        />
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

  const view = getDocumentViewModel(document)

  return (
    <div>
      <div className={styles.topBar}>
        <Link to="/documents" className={styles.back}>
          ← 서류
        </Link>
      </div>

      <div className={styles.headerRow}>
        <h1 className={styles.title}>{view.typeLabel}</h1>
        <StatusLabel tone={view.statusTone}>{view.statusLabel}</StatusLabel>
      </div>
      <p className={styles.meta}>
        {view.workerName} · {view.expiry.display}
      </p>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>첨부 미리보기</h2>
        {/* TODO(backend): file_id로 실제 파일을 내려받는 API가 아직 없음 */}
        <div className={styles.previewBox}>
          <p className={styles.previewFileName}>{view.typeLabel}</p>
          <p className={styles.previewNote}>{view.fileLabel} · 미리보기 API 연결 전입니다.</p>
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
        <Button variant="secondary" disabled>
          반려
        </Button>
        <Button disabled>
          {view.reviewable ? '확인 완료 API 대기' : view.actionLabel}
        </Button>
      </div>
    </div>
  )
}
