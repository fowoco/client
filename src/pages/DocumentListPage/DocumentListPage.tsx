import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchDocuments, type DocumentItemResponse } from '../../api/documents'
import { getErrorMessage } from '../../api/errors'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { ListRow } from '../../components/ui/ListRow/ListRow'
import { SearchInput } from '../../components/ui/SearchInput/SearchInput'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { daysUntil } from '../../utils/urgency'
import { DOCUMENT_TYPE_LABEL } from '../../utils/documentLabels'
import { getDocumentViewModel } from '../../view-models/documentViewModel'
import styles from './DocumentListPage.module.css'
import { FileUploadModal } from './FileUploadModal'

type TabId = 'all' | 'needs-review' | 'expiring-soon' | 'missing' | 'completed'

const EXPIRING_SOON_WITHIN_DAYS = 30

// 요청 전송 여부와 최근 업로드 시각은 현재 Document API에 없다. MISSING을 "요청 중"으로
// 추측하지 않고 서버가 보장하는 제출 상태와 expiry_date만 사용한다.
function matchesTab(document: DocumentItemResponse, tab: TabId): boolean {
  if (tab === 'all') return true
  if (tab === 'needs-review') return document.submission_status === 'SUBMITTED'
  if (tab === 'expiring-soon') {
    const days = daysUntil(document.expiry_date)
    return days !== null && days >= 0 && days <= EXPIRING_SOON_WITHIN_DAYS
  }
  if (tab === 'missing') return document.submission_status === 'MISSING'
  return document.submission_status === 'VERIFIED'
}

const DOCUMENT_TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'needs-review', label: '검토 필요' },
  { id: 'expiring-soon', label: '만료 예정' },
  { id: 'missing', label: '누락 문서' },
  { id: 'completed', label: '완료' },
]

export function DocumentListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const workerId = searchParams.get('workerId')?.trim() || null
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [query, setQuery] = useState('')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const debouncedQuery = useDebouncedValue(query)

  const { status, data, error, refetch } = useApiQuery(
    useCallback(() => fetchDocuments({ workerId: workerId ?? undefined, size: 100 }), [workerId]),
    useCallback((page: { items: unknown[] }) => page.items.length === 0, []),
  )
  const documents = useMemo(() => data?.items ?? [], [data])

  const tabsWithCounts = useMemo(
    () =>
      DOCUMENT_TABS.map((tab) => ({
        ...tab,
        count: documents.filter((doc) => matchesTab(doc, tab.id)).length,
      })),
    [documents],
  )

  const metricStrip = useMemo(
    () => [
      { id: 'total', label: '전체 문서', value: documents.length },
      { id: 'needs-review', label: '검토 필요', value: documents.filter((doc) => doc.submission_status === 'SUBMITTED').length },
      {
        id: 'expiring-soon',
        label: '30일 내 만료',
        value: documents.filter((doc) => matchesTab(doc, 'expiring-soon')).length,
      },
      { id: 'missing', label: '누락 문서', value: documents.filter((doc) => doc.submission_status === 'MISSING').length },
    ],
    [documents],
  )

  const visibleDocuments = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase()
    return documents.filter((document) => {
      const matchesActiveTab = matchesTab(document, activeTab)
      const matchesQuery =
        !normalized ||
        (document.display_name ?? '').toLowerCase().includes(normalized) ||
        DOCUMENT_TYPE_LABEL[document.document_type].toLowerCase().includes(normalized)
      return matchesActiveTab && matchesQuery
    })
  }, [documents, activeTab, debouncedQuery])

  function handleReviewDocument(workerDocumentId: string) {
    navigate(`/documents/${workerDocumentId}`)
  }

  function handleClearWorkerFilter() {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('workerId')
    setSearchParams(nextParams)
  }

  return (
    <div>
      <h1 className={styles.headline}>근로자별 서류 제출 현황</h1>
      <p className={styles.description}>
        서류 없음·승인 대기·완료 상태와 문서 만료일을 서버 응답 기준으로 확인합니다.
      </p>

      {workerId && (
        <div className={styles.workerFilterNotice} role="status">
          <span>업무함에서 선택한 근로자의 문서만 표시합니다.</span>
          <button type="button" onClick={handleClearWorkerFilter}>
            전체 문서 보기
          </button>
        </div>
      )}

      <div className={styles.metricStrip}>
        {metricStrip.map((metric) => (
          <div key={metric.id} className={styles.metricCard}>
            <span className={styles.metricLabel}>{metric.label}</span>
            <span className={styles.metricValue}>{metric.value}</span>
          </div>
        ))}
      </div>

      <Tabs tabs={tabsWithCounts} activeId={activeTab} onChange={(id) => setActiveTab(id as TabId)} ariaLabel="서류 탭" />

      <div className={styles.toolbar}>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="근로자명·서류 종류 검색"
          ariaLabel="서류 검색"
        />
        <button type="button" className={styles.uploadButton} onClick={() => setUploadModalOpen(true)}>
          ＋ HWP/HWPX 업로드
        </button>
      </div>

      <FileUploadModal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />

      {status === 'loading' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="loading"
            title="서류 목록을 불러오는 중입니다"
            body="잠시만 기다려 주세요."
            note="처리 중 · 중복 실행 차단"
          />
        </div>
      )}

      {status === 'error' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="error"
            title="서류 목록을 불러오지 못했습니다"
            body={error ? getErrorMessage(error) : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'}
            actionLabel="다시 시도"
            onAction={refetch}
          />
        </div>
      )}

      {status === 'empty' && (
        <div className={styles.stateWrap}>
          <EmptyState kind="empty" title="등록된 서류가 없습니다" body="근로자가 서류를 제출하면 여기에 표시됩니다." />
        </div>
      )}

      {status === 'success' && (
        <>
          <div className={styles.columnHeader}>
            <span>근로자 · 서류 종류</span>
            <span>상태</span>
            <span>만료일</span>
            <span />
          </div>

          {data && data.total_elements > data.items.length && (
            <p className={styles.capNotice}>
              전체 {data.total_elements}건 중 {data.items.length}건만 불러왔습니다. 찾는 서류가 안 보이면
              검색어를 바꿔보세요.
            </p>
          )}

          {visibleDocuments.length === 0 ? (
            <div className={styles.stateWrap}>
              <EmptyState kind="empty" title="검색 결과가 없습니다" body="다른 검색어로 다시 시도해 보세요." />
            </div>
          ) : (
            <div className={styles.list}>
              {visibleDocuments.map((document) => {
                const view = getDocumentViewModel(document)
                return (
                  <ListRow key={view.id} columns="1fr 120px 170px 100px">
                    <div className={styles.rowMain}>
                      <p className={styles.workerName}>{view.workerName}</p>
                      <p className={styles.docType}>{view.typeLabel}</p>
                    </div>
                    <StatusLabel tone={view.statusTone}>{view.statusLabel}</StatusLabel>
                    <span className={styles.submittedAt}>{view.expiry.display}</span>
                    <button
                      type="button"
                      className={styles.reviewButton}
                      onClick={() => handleReviewDocument(view.id)}
                    >
                      {view.actionLabel}
                    </button>
                  </ListRow>
                )
              })}
            </div>
          )}

          <p className={styles.footerText}>
            {data?.total_elements ?? documents.length}건 중 {visibleDocuments.length}건 표시
          </p>
        </>
      )}
    </div>
  )
}
