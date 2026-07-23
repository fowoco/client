import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useAsyncDemoData } from '../../hooks/useAsyncDemoData'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import styles from './DocumentListPage.module.css'
import {
  DOCUMENT_STATUS_LABEL,
  DOCUMENT_STATUS_TONE,
  DOCUMENT_TABS,
  DOCUMENTS,
  TOTAL_DOCUMENT_COUNT,
  type DocumentStatus,
} from './documentListData'

const TAB_STATUS: Record<string, DocumentStatus | null> = {
  all: null,
  missing: 'missing',
  pending: 'pending',
  done: 'done',
}

export function DocumentListPage() {
  const navigate = useNavigate()
  const status = useAsyncDemoData(DOCUMENTS.length === 0)
  const [activeTab, setActiveTab] = useState(DOCUMENT_TABS[0].id)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)

  const visibleDocuments = useMemo(() => {
    const tabStatus = TAB_STATUS[activeTab]
    const normalized = debouncedQuery.trim().toLowerCase()

    return DOCUMENTS.filter((document) => {
      const matchesTab = tabStatus === null || document.status === tabStatus
      const matchesQuery =
        !normalized ||
        document.workerName.toLowerCase().includes(normalized) ||
        document.docType.toLowerCase().includes(normalized)
      return matchesTab && matchesQuery
    })
  }, [activeTab, debouncedQuery])

  function handleReviewDocument(documentId: string) {
    navigate(`/documents/${documentId}`)
  }

  return (
    <div>
      <h1 className={styles.headline}>근로자별 서류 제출 현황</h1>
      <p className={styles.description}>
        미제출·확인 대기 서류를 우선 보여주며, 확인이 끝나면 상태가 자동으로 갱신됩니다.
      </p>

      <div className={styles.tabs} role="tablist" aria-label="서류 탭">
        {DOCUMENT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label} {tab.count}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="근로자명·서류 종류 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="서류 검색"
        />
      </div>

      {status === 'loading' && (
        <div className={styles.stateWrap}>
          <EmptyState kind="loading" title="서류 목록을 불러오는 중입니다" body="잠시만 기다려 주세요." />
        </div>
      )}

      {status === 'error' && (
        <div className={styles.stateWrap}>
          <EmptyState
            kind="error"
            title="서류 목록을 불러오지 못했습니다"
            body="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
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
            <span>제출일</span>
            <span />
          </div>

          {visibleDocuments.length === 0 ? (
            <div className={styles.stateWrap}>
              <EmptyState kind="empty" title="검색 결과가 없습니다" body="다른 검색어로 다시 시도해 보세요." />
            </div>
          ) : (
            <div className={styles.list}>
              {visibleDocuments.map((document) => (
                <div key={document.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <p className={styles.workerName}>{document.workerName}</p>
                    <p className={styles.docType}>{document.docType}</p>
                  </div>
                  <StatusLabel tone={DOCUMENT_STATUS_TONE[document.status]}>
                    {DOCUMENT_STATUS_LABEL[document.status]}
                  </StatusLabel>
                  <span className={styles.submittedAt}>{document.submittedAt}</span>
                  <button
                    type="button"
                    className={styles.reviewButton}
                    onClick={() => handleReviewDocument(document.id)}
                  >
                    확인하기 →
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className={styles.footerText}>
            {TOTAL_DOCUMENT_COUNT}건 중 {visibleDocuments.length}건 표시
          </p>
        </>
      )}
    </div>
  )
}
