import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchDocument } from '../../api/documents'
import { ApiError, getErrorMessage } from '../../api/errors'
import { downloadFile, previewFile } from '../../api/files'
import { Button } from '../../components/ui/Button/Button'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useToastStore } from '../../store/toastStore'
import { saveBlobAsFile } from '../../utils/fileDownload'
import { getDocumentViewModel } from '../../view-models/documentViewModel'
import { DocumentOcrPanel } from './DocumentOcrPanel'
import { PdfPreviewCanvas } from './PdfPreviewCanvas'
import styles from './DocumentDetailPage.module.css'

export function DocumentDetailPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [downloading, setDownloading] = useState(false)
  const showToast = useToastStore((state) => state.showToast)

  const {
    status: fetchStatus,
    data: document,
    error,
    refetch,
  } = useApiQuery(useCallback(() => fetchDocument(documentId ?? ''), [documentId]))
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState(false)

  const fileId = document?.file_id ?? null
  const fileMimeType = document?.file_mime_type ?? null
  const canPreview = Boolean(fileId && isPreviewableMimeType(fileMimeType))
  const previewIsImage = previewMimeType?.startsWith('image/') ?? false
  const previewIsPdf = previewMimeType === 'application/pdf'

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    setPreviewUrl(null)
    setPreviewMimeType(null)
    setPreviewError(false)
    if (!canPreview || !fileId) return

    previewFile(fileId)
      .then((preview) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(preview.blob)
        setPreviewUrl(objectUrl)
        setPreviewMimeType(preview.mime_type)
      })
      .catch(() => {
        if (!cancelled) setPreviewError(true)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [canPreview, fileId])

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

  if (fetchStatus === 'error' && error?.status === 404) {
    return (
      <div className={styles.stateWrap}>
        <EmptyState
          kind="empty"
          title="서류를 찾을 수 없습니다"
          body="서류 목록에서 다시 확인해 주세요."
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

  if (fetchStatus === 'empty' || !document) {
    return (
      <div className={styles.stateWrap}>
        <EmptyState
          kind="empty"
          title="서류를 찾을 수 없습니다"
          body="서류 목록에서 다시 확인해 주세요."
        />
      </div>
    )
  }

  const view = getDocumentViewModel(document)
  async function handleDownload() {
    if (!fileId || downloading) return
    setDownloading(true)
    try {
      const downloaded = await downloadFile(fileId)
      saveBlobAsFile(downloaded.blob, downloaded.file_name ?? view.typeLabel)
    } catch (downloadError) {
      showToast(
        downloadError instanceof ApiError
          ? getErrorMessage(downloadError)
          : '첨부 파일을 내려받지 못했습니다.',
      )
    } finally {
      setDownloading(false)
    }
  }

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
        <h2 className={styles.cardTitle}>첨부 파일</h2>
        <div className={styles.previewBox}>
          <p className={styles.previewFileName}>{document.file_name ?? view.typeLabel}</p>
          {previewIsImage && previewUrl && (
            <img
              className={styles.previewImage}
              src={previewUrl}
              alt={`${view.typeLabel} 미리보기`}
            />
          )}
          {previewIsPdf && previewUrl && (
            <PdfPreviewCanvas url={previewUrl} title={`${view.typeLabel} PDF 미리보기`} />
          )}
          <p className={styles.previewNote}>
            {!fileId && '이 문서에는 연결된 파일이 없습니다.'}
            {fileId &&
              canPreview &&
              !previewUrl &&
              !previewError &&
              '문서 미리보기를 불러오는 중입니다.'}
            {fileId &&
              canPreview &&
              previewError &&
              '미리보기를 불러오지 못했습니다. 원본 다운로드를 이용해 주세요.'}
            {fileId && !canPreview && '이 형식은 원본 파일 다운로드만 지원합니다.'}
          </p>
          {fileId && (
            <Button variant="secondary" disabled={downloading} onClick={handleDownload}>
              {downloading ? '다운로드 중…' : '원본 다운로드'}
            </Button>
          )}
        </div>
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.cardTitle}>관련 근로자</h2>
        <div className={styles.relatedLinks}>
          <button
            type="button"
            className={styles.relatedLink}
            onClick={() => navigate(`/workers/${document.worker_id}/detail`)}
          >
            {document.display_name ?? '근로자'} 정보 →
          </button>
        </div>
      </div>

      <DocumentOcrPanel
        documentId={document.worker_document_id}
        documentType={document.document_type}
        fileId={document.file_id}
      />
    </div>
  )
}

function isPreviewableMimeType(mimeType: string | null) {
  if (!mimeType) return false
  return (
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType === 'application/x-hwp' ||
    mimeType === 'application/hwp' ||
    mimeType === 'application/vnd.hancom.hwp' ||
    mimeType === 'application/hwp+zip'
  )
}
