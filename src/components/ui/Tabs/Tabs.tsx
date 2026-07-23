import styles from './Tabs.module.css'

export interface TabItem {
  id: string
  label: string
  count?: number
}

export interface TabsProps {
  tabs: TabItem[]
  activeId: string
  onChange: (id: string) => void
  ariaLabel: string
  /** 지정하면 각 탭에 `${idPrefix}-tab-${index}`/`aria-controls={idPrefix}-panel-${index}`를 연결한다. */
  idPrefix?: string
}

export function Tabs({ tabs, activeId, onChange, ariaLabel, idPrefix }: TabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          id={idPrefix ? `${idPrefix}-tab-${index}` : undefined}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          aria-controls={idPrefix ? `${idPrefix}-panel-${index}` : undefined}
          className={`${styles.tab} ${activeId === tab.id ? styles.tabActive : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined ? ` ${tab.count}` : ''}
        </button>
      ))}
    </div>
  )
}
