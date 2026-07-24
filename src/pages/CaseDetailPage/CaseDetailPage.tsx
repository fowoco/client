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
import { ApprovalDecisionModal } from './overlays/ApprovalDecisionModal'
import { ApprovalRequestModal } from './overlays/ApprovalRequestModal'
import { ApprovalSnapshotDiffModal } from './overlays/ApprovalSnapshotDiffModal'
import { ExternalCompletionModal } from './overlays/ExternalCompletionModal'
import { InternalCompletionModal } from './overlays/InternalCompletionModal'
import { OtherApproverHandledModal } from './overlays/OtherApproverHandledModal'
import { RejectionReasonModal } from './overlays/RejectionReasonModal'

type ApprovalOverlay = 'none' | 'request' | 'decision' | 'rejection' | 'other-handled' | 'snapshot-diff'
type ApprovalState = 'pending' | 'approved' | 'rejected'
type CompletionOverlay = 'none' | 'external' | 'internal-demo'
type CompletionState = 'blocked' | 'completed'

const APPROVAL_BADGE: Record<ApprovalState, { label: string; tone: StatusTone }> = {
  pending: { label: '승인 대기', tone: 'warning' },
  approved: { label: '승인 완료', tone: 'success' },
  rejected: { label: '반려됨', tone: 'critical' },
}

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
  const [approvalOverlay, setApprovalOverlay] = useState<ApprovalOverlay>('none')
  const [approvalState, setApprovalState] = useState<ApprovalState>('pending')
  const [completionOverlay, setCompletionOverlay] = useState<CompletionOverlay>('none')
  const [completionState, setCompletionState] = useState<CompletionState>('blocked')
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

  function handleOpenApprovalRequest() {
    setApprovalOverlay('request')
  }

  function handleSubmitApprovalRequest() {
    // TODO(backend): POST /api/work-items/:id/approval-request -> 승인 대기 상태로 전환
    setApprovalOverlay('none')
    showToast('승인을 요청했습니다.')
  }

  function handleOpenReview() {
    // 데모 진입점: 실제로는 승인자 계정으로 로그인해야 볼 수 있는 화면이다.
    setApprovalOverlay(approvalState === 'pending' ? 'decision' : 'other-handled')
  }

  function handleApprove() {
    // TODO(backend): POST /api/work-items/:id/approval-decisions { decision: 'approved' }
    setApprovalState('approved')
    setApprovalOverlay('none')
    showToast('승인했습니다.')
  }

  function handleStartReject() {
    setApprovalOverlay('rejection')
  }

  function handleConfirmReject(reason: string) {
    // TODO(backend): POST /api/work-items/:id/approval-decisions { decision: 'rejected', reason }
    void reason
    setApprovalState('rejected')
    setApprovalOverlay('none')
    showToast('반려했습니다.')
  }

  function handleOpenSnapshotDiff() {
    setApprovalOverlay('snapshot-diff')
  }

  function handleRequestReapproval() {
    // TODO(backend): POST /api/work-items/:id/approval-request -> 재승인 요청, 승인 대기 상태로 전환
    setApprovalState('pending')
    setApprovalOverlay('none')
    showToast('재승인을 요청했습니다.')
  }

  function handleOpenExternalCompletion() {
    if (approvalState !== 'approved' || completionState === 'completed') return
    setCompletionOverlay('external')
  }

  function handleCompleteExternal(evidenceType: string, evidenceValue: string, memo: string) {
    // TODO(backend): POST /api/work-items/:id/complete { evidenceType, evidenceValue, memo }
    void evidenceType
    void evidenceValue
    void memo
    setCompletionState('completed')
    setCompletionOverlay('none')
    showToast('완료 처리했습니다.')
  }

  function handleOpenInternalCompletionDemo() {
    setCompletionOverlay('internal-demo')
  }

  function handleCompleteInternalDemo(memo: string) {
    // 이 데모 케이스는 외부기관 유형이라 실제 완료 상태에는 반영하지 않는다.
    void memo
    setCompletionOverlay('none')
    showToast('(데모) 내부업무를 완료 처리했습니다.')
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
        <StatusLabel tone={APPROVAL_BADGE[approvalState].tone}>
          {APPROVAL_BADGE[approvalState].label}
        </StatusLabel>
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

              <DetailRow
                label="승인"
                value={
                  approvalState === 'approved' ? '완료' : approvalState === 'rejected' ? '반려됨' : '대기'
                }
                tone={
                  approvalState === 'approved' ? 'success' : approvalState === 'rejected' ? 'critical' : 'warning'
                }
              />
              <DetailRow
                label={COMPLETION_GATES.rows[1].label}
                value={COMPLETION_GATES.rows[1].value}
                tone={COMPLETION_GATES.rows[1].tone}
              />
              <DetailRow
                label="완료 증빙"
                value={completionState === 'completed' ? '접수번호 등록됨' : '접수번호 필요'}
                tone={completionState === 'completed' ? 'success' : 'critical'}
              />
              <DetailRow
                label="담당자 직접 처리"
                value={completionState === 'completed' ? '확인됨' : '미확인'}
                tone={completionState === 'completed' ? 'success' : 'critical'}
              />

              {approvalState === 'approved' && completionState === 'blocked' ? (
                <button type="button" className={styles.contextLink} onClick={handleOpenExternalCompletion}>
                  완료 처리 시작 →
                </button>
              ) : completionState === 'completed' ? (
                <p className={styles.gateComplete}>완료 처리되었습니다.</p>
              ) : (
                <p className={styles.gateBlocked}>{COMPLETION_GATES.blocked}</p>
              )}

              <button type="button" className={styles.draftSave} onClick={handleOpenInternalCompletionDemo}>
                데모: 내부업무 완료 보기
              </button>
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
        <button type="button" className={styles.draftSave} onClick={handleOpenReview}>
          데모: 승인자로 검토
        </button>
        <button type="button" className={styles.draftSave} onClick={handleOpenSnapshotDiff}>
          데모: 재승인 필요 보기
        </button>
        <button type="button" className={styles.draftSave} onClick={handleSaveDraft}>
          {ACTION_DOCK.draftSaveLabel}
        </button>
        <Button onClick={handleOpenApprovalRequest}>{ACTION_DOCK.approveLabel}</Button>
      </div>

      <p className={styles.footnote}>{ACTION_DOCK.footnote}</p>

      <ApprovalRequestModal
        open={approvalOverlay === 'request'}
        onClose={() => setApprovalOverlay('none')}
        onSubmit={handleSubmitApprovalRequest}
      />
      <ApprovalDecisionModal
        open={approvalOverlay === 'decision'}
        onClose={() => setApprovalOverlay('none')}
        onApprove={handleApprove}
        onReject={handleStartReject}
      />
      <RejectionReasonModal
        open={approvalOverlay === 'rejection'}
        onBack={() => setApprovalOverlay('decision')}
        onConfirm={handleConfirmReject}
      />
      <OtherApproverHandledModal
        open={approvalOverlay === 'other-handled'}
        onClose={() => setApprovalOverlay('none')}
      />
      <ApprovalSnapshotDiffModal
        open={approvalOverlay === 'snapshot-diff'}
        onClose={() => setApprovalOverlay('none')}
        onRequestReapproval={handleRequestReapproval}
      />
      <ExternalCompletionModal
        open={completionOverlay === 'external'}
        onClose={() => setCompletionOverlay('none')}
        onComplete={handleCompleteExternal}
      />
      <InternalCompletionModal
        open={completionOverlay === 'internal-demo'}
        onClose={() => setCompletionOverlay('none')}
        onComplete={handleCompleteInternalDemo}
      />

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
