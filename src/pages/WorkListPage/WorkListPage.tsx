import { useMemo, useState } from 'react'
import { WorkItemRow } from '../../components/ui/WorkItemRow/WorkItemRow'
import styles from './WorkListPage.module.css'
import { TOTAL_WORK_COUNT, WORK_ITEMS, WORK_TABS } from './workListData'

export function WorkListPage() {
  const [activeTab, setActiveTab] = useState(WORK_TABS[0].id)
  const [query, setQuery] = useState('')

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return WORK_ITEMS
    return WORK_ITEMS.filter((item) => item.title.toLowerCase().includes(normalized))
  }, [query])

  return (
    <div>
      <h1 className={styles.headline}>먼저 처리할 5건을 다음 행동 순서로 정리했습니다.</h1>
      <p className={styles.description}>
        근로자와 연결되지 않은 내부 사무업무도 같은 업무 구조로 표시됩니다.
      </p>

      <div className={styles.tabs} role="tablist" aria-label="업무함 탭">
        {WORK_TABS.map((tab) => (
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
          placeholder="업무명·대상·담당자 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="업무 검색"
        />
        <select className={styles.filter} aria-label="상태 필터" defaultValue="all">
          <option value="all">상태 · 전체</option>
        </select>
        <select className={styles.filter} aria-label="마감 필터" defaultValue="30">
          <option value="30">마감 · 30일</option>
        </select>
        <button type="button" className={styles.advancedFilter}>
          고급 필터 7개 ▾
        </button>
      </div>

      <div className={styles.columnHeader}>
        <span>업무</span>
        <span>다음 행동</span>
      </div>

      <div className={styles.list}>
        {visibleItems.map((item) => (
          <WorkItemRow
            key={item.id}
            title={item.title}
            meta={item.meta}
            nextAction={item.nextAction}
            urgency={item.urgency}
          />
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerText}>
          {TOTAL_WORK_COUNT}개 중 우선 업무 {WORK_ITEMS.length}개 표시
        </span>
        <button type="button" className={styles.footerLink}>
          전체 업무 보기 →
        </button>
      </div>
    </div>
  )
}
