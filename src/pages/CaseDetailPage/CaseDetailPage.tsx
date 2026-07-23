import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AgentSummary } from '../../components/ui/AgentSummary/AgentSummary'
import { Button } from '../../components/ui/Button/Button'
import { DetailRow } from '../../components/ui/DetailRow/DetailRow'
import { Drawer } from '../../components/ui/Drawer/Drawer'
import { StatusLabel, type StatusTone } from '../../components/ui/StatusLabel/StatusLabel'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import { useToastStore } from '../../store/toastStore'
import styles from './CaseDetailPage.module.css'
import {
  ACTION_DOCK,
  AGENT_SUMMARY,
  CASE_ACTIVITY,
  CASE_CHECKLIST,
  CASE_COMMUNICATION,
  CASE_DOCUMENTS,
  CASE_HEADER,
  CASE_STEPS,
  CASE_TABS,
  COMPLETION_GATES,
  CONTEXT_ACCESS,
  CONTEXT_DRAWER,
  type CaseDocumentStatus,
  type StepStatus,
} from './caseDetailData'

const CASE_TAB_ITEMS = CASE_TABS.map((label) => ({ id: label, label }))

const DOCUMENT_STATUS_TONE: Record<CaseDocumentStatus, StatusTone> = {
  missing: 'critical',
  pending: 'warning',
  done: 'success',
}

const DOCUMENT_STATUS_LABEL: Record<CaseDocumentStatus, string> = {
  missing: '미제출',
  pending: '확인 대기',
  done: '확인 완료',
}

const STEP_CIRCLE_CLASS: Record<StepStatus, string> = {
  done: styles.stepCircleDone,
  pending: styles.stepCirclePending,
  locked: styles.stepCircleLocked,
  waiting: styles.stepCircleWaiting,
}

const STEP_STATUS_CLASS: Record<StepStatus, string> = {
  done: styles.stepStatusDone,
  pending: styles.stepStatusPending,
  locked: styles.stepStatusLocked,
  waiting: styles.stepStatusWaiting,
}

export function CaseDetailPage() {
  const [activeTab, setActiveTab] = useState(CASE_TABS[0])
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [contextDrawerOpen, setContextDrawerOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const showToast = useToastStore((state) => state.showToast)

  useEffect(() => {
    if (!moreMenuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!moreMenuRef.current?.contains(event.target as Node)) {
        setMoreMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [moreMenuOpen])

  function handleRequestApproval() {
    // TODO(backend): POST /api/work-items/:id/approval-request -> 승인 대기 상태로 전환
    showToast('승인을 요청했습니다.')
  }

  function handleMoreActions() {
    setMoreMenuOpen((open) => !open)
  }

  function handleCancelCase() {
    // TODO(backend): POST /api/work-items/:id/cancel -> 업무 취소
    setMoreMenuOpen(false)
  }

  function handleReassignCase() {
    // TODO(backend): PATCH /api/work-items/:id/assignee -> 담당자 변경
    setMoreMenuOpen(false)
  }

  function handleExpandContext() {
    setContextDrawerOpen(true)
  }

  function handleSaveDraft() {
    // TODO(backend): PATCH /api/work-items/:id/draft -> 현재 입력 상태 저장
    showToast('초안을 저장했습니다.')
  }

  return (
    <div>
      <div className={styles.topBar}>
        <Link to="/tasks" className={styles.back}>
          ← 업무함
        </Link>
        <div className={styles.moreWrap} ref={moreMenuRef}>
          <button
            type="button"
            className={styles.more}
            aria-haspopup="menu"
            aria-expanded={moreMenuOpen}
            onClick={handleMoreActions}
          >
            더보기 ···
          </button>
          {moreMenuOpen && (
            <ul className={styles.moreMenu} role="menu" aria-label="업무 더보기 메뉴">
              <li role="presentation">
                <button type="button" role="menuitem" className={styles.moreMenuItem} onClick={handleCancelCase}>
                  취소
                </button>
              </li>
              <li role="presentation">
                <button
                  type="button"
                  role="menuitem"
                  className={styles.moreMenuItem}
                  onClick={handleReassignCase}
                >
                  담당자 변경
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      <div className={styles.headerRow}>
        <h1 className={styles.title}>{CASE_HEADER.title}</h1>
        <StatusLabel tone="warning">{CASE_HEADER.badges[0]}</StatusLabel>
        <StatusLabel tone="info">{CASE_HEADER.badges[1]}</StatusLabel>
      </div>
      <p className={styles.meta}>{CASE_HEADER.meta}</p>

      <Tabs
        tabs={CASE_TAB_ITEMS}
        activeId={activeTab}
        onChange={setActiveTab}
        ariaLabel="업무 상세 탭"
        idPrefix="case"
      />

      {activeTab === '현재 단계' && (
        <div id="case-panel-0" role="tabpanel" aria-labelledby="case-tab-0">
          <div className={styles.summaryRow}>
            <AgentSummary
              headline={AGENT_SUMMARY.headline}
              body={AGENT_SUMMARY.body}
              actionLabel={AGENT_SUMMARY.actionLabel}
            />

            <div className={styles.contextCard}>
              <p className={styles.contextLabel}>{CONTEXT_ACCESS.label}</p>
              <p className={styles.contextValues}>
                {CONTEXT_ACCESS.rows.map((row) => (
                  <span key={row.label}>
                    {row.label} {row.value}
                    <br />
                  </span>
                ))}
              </p>
              <button type="button" className={styles.contextLink} onClick={handleExpandContext}>
                펼쳐 보기 →
              </button>
            </div>
          </div>

          <div className={styles.panelRow}>
            <div className={styles.workflowCard}>
              <div className={styles.workflowHeader}>
                <h2 className={styles.cardTitle}>처리 단계</h2>
                <p className={styles.workflowNote}>필수 단계 3 / 5 완료</p>
              </div>

              <div className={styles.stepList}>
                {CASE_STEPS.map((step, index) => (
                  <div key={step.no} className={styles.step}>
                    <div className={styles.stepMarkerCol}>
                      <span className={`${styles.stepCircle} ${STEP_CIRCLE_CLASS[step.status]}`}>
                        {step.status === 'done' ? '✓' : step.no}
                      </span>
                      {index < CASE_STEPS.length - 1 && (
                        <span
                          className={`${styles.connector} ${
                            step.status === 'done' ? styles.connectorDone : ''
                          }`}
                        />
                      )}
                    </div>
                    <div className={styles.stepBody}>
                      <div>
                        <p className={styles.stepTitle}>{step.title}</p>
                        <p className={styles.stepActor}>{step.actor}</p>
                      </div>
                      <span className={`${styles.stepStatus} ${STEP_STATUS_CLASS[step.status]}`}>
                        {step.statusLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.gatesCard}>
              <h2 className={styles.cardTitle}>완료 조건</h2>
              <p className={styles.gatesDescription}>{COMPLETION_GATES.description}</p>

              {COMPLETION_GATES.rows.map((row) => (
                <DetailRow key={row.label} label={row.label} value={row.value} tone={row.tone} />
              ))}

              <p className={styles.gateBlocked}>{COMPLETION_GATES.blocked}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === '체크리스트' && (
        <div id="case-panel-1" role="tabpanel" aria-labelledby="case-tab-1" className={styles.tabPanel}>
          {/* TODO(backend): GET /api/work-items/:id/checklist -> CASE_CHECKLIST 대체, PATCH로 완료 토글 */}
          <div className={styles.checklist}>
            {CASE_CHECKLIST.map((item) => (
              <div key={item.id} className={styles.checklistRow}>
                <span
                  className={`${styles.checklistMark} ${
                    item.done ? styles.checklistMarkDone : ''
                  }`}
                  aria-hidden="true"
                >
                  {item.done ? '✓' : ''}
                </span>
                <span
                  className={`${styles.checklistLabel} ${
                    item.done ? styles.checklistLabelDone : ''
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === '문서' && (
        <div id="case-panel-2" role="tabpanel" aria-labelledby="case-tab-2" className={styles.tabPanel}>
          {/* TODO(backend): GET /api/work-items/:id/documents -> CASE_DOCUMENTS 대체 */}
          <div className={styles.documentList}>
            {CASE_DOCUMENTS.map((document) => (
              <div key={document.id} className={styles.documentRow}>
                <span className={styles.documentName}>{document.name}</span>
                <StatusLabel tone={DOCUMENT_STATUS_TONE[document.status]}>
                  {DOCUMENT_STATUS_LABEL[document.status]}
                </StatusLabel>
                <span className={styles.documentUpdatedAt}>{document.updatedAt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === '소통' && (
        <div id="case-panel-3" role="tabpanel" aria-labelledby="case-tab-3" className={styles.tabPanel}>
          {/* TODO(backend): GET /api/work-items/:id/communication -> CASE_COMMUNICATION 대체 */}
          <div className={styles.commList}>
            {CASE_COMMUNICATION.map((entry) => (
              <div key={entry.id} className={styles.commRow}>
                <span className={styles.commTime}>{entry.time}</span>
                <span className={styles.commActor}>{entry.actor}</span>
                <p className={styles.commMessage}>{entry.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === '활동이력' && (
        <div id="case-panel-4" role="tabpanel" aria-labelledby="case-tab-4" className={styles.tabPanel}>
          {/* TODO(backend): GET /api/work-items/:id/activity -> CASE_ACTIVITY 대체 */}
          <div className={styles.timeline}>
            {CASE_ACTIVITY.map((entry) => (
              <div key={`${entry.date}-${entry.label}`} className={styles.timelineRow}>
                <span className={styles.timelineDate}>{entry.date}</span>
                <span
                  className={`${styles.timelineDot} ${
                    entry.highlighted ? styles.timelineDotHighlighted : ''
                  }`}
                />
                <span className={styles.timelineLabel}>{entry.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actionDock}>
        <span className={styles.nextStep}>{ACTION_DOCK.nextStep}</span>
        <button type="button" className={styles.draftSave} onClick={handleSaveDraft}>
          {ACTION_DOCK.draftSaveLabel}
        </button>
        <Button onClick={handleRequestApproval}>{ACTION_DOCK.approveLabel}</Button>
      </div>

      <p className={styles.footnote}>{ACTION_DOCK.footnote}</p>

      <Drawer open={contextDrawerOpen} onClose={() => setContextDrawerOpen(false)} title="관련 Context">
        {/* TODO(backend): GET /api/work-items/:id/context -> CONTEXT_DRAWER 대체 */}
        <div className={styles.contextSection}>
          <h3 className={styles.contextSectionTitle}>Agent가 확인한 내용</h3>
          <ul className={styles.contextList}>
            {CONTEXT_DRAWER.agentConfirmed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className={styles.contextSection}>
          <h3 className={styles.contextSectionTitle}>부족한 정보</h3>
          <ul className={styles.contextList}>
            {CONTEXT_DRAWER.missingInfo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className={styles.contextSection}>
          <h3 className={styles.contextSectionTitle}>공식 출처</h3>
          {CONTEXT_DRAWER.officialSources.map((source) => (
            <DetailRow key={source.label} label={source.label} value={source.value} />
          ))}
        </div>

        <div className={styles.contextSection}>
          <h3 className={styles.contextSectionTitle}>최근 활동</h3>
          <div className={styles.timeline}>
            {CASE_ACTIVITY.slice(0, 3).map((entry) => (
              <div key={`${entry.date}-${entry.label}`} className={styles.timelineRow}>
                <span className={styles.timelineDate}>{entry.date}</span>
                <span
                  className={`${styles.timelineDot} ${
                    entry.highlighted ? styles.timelineDotHighlighted : ''
                  }`}
                />
                <span className={styles.timelineLabel}>{entry.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.contextSection}>
          <h3 className={styles.contextSectionTitle}>HR이 할 일</h3>
          <ul className={styles.contextList}>
            {CONTEXT_DRAWER.hrTodo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </Drawer>
    </div>
  )
}
