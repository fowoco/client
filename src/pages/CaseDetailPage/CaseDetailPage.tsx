import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  approveTask,
  buildTaskApprovalSnapshot,
  completeTask,
  recordTaskEvidence,
  rejectTask,
  requestTaskApproval,
  type EvidenceType,
} from '../../api/approvals'
import { fetchTaskActivities } from '../../api/audit'
import { fetchDocumentReadiness, fetchDocuments, upsertDocumentRequestDraft } from '../../api/documents'
import { ApiError, getErrorMessage } from '../../api/errors'
import { cancelTask, fetchTaskById, updateChecklistItem } from '../../api/tasks'
import { AgentSourceLabel } from '../../components/ui/AgentSourceLabel/AgentSourceLabel'
import { AgentSummary } from '../../components/ui/AgentSummary/AgentSummary'
import { Button } from '../../components/ui/Button/Button'
import { DetailRow } from '../../components/ui/DetailRow/DetailRow'
import { Drawer } from '../../components/ui/Drawer/Drawer'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { StatusLabel, type StatusTone } from '../../components/ui/StatusLabel/StatusLabel'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useToastStore } from '../../store/toastStore'
import { ACTOR_TYPE_TO_AGENT_SOURCE, AUDIT_ACTION_LABEL } from '../../utils/auditLabels'
import { formatEventTime } from '../../utils/datetime'
import { TASK_SOURCE_LABEL, TASK_STATUS_LABEL, TASK_STATUS_TONE } from '../../utils/taskStatus'
import { getDocumentViewModel } from '../../view-models/documentViewModel'
import { getOperationalDateViewModel } from '../../view-models/dateViewModel'
import styles from './CaseDetailPage.module.css'
import {
  AGENT_SUMMARY,
  CASE_COMMUNICATION,
  CASE_TABS,
  CONTEXT_ACCESS,
  CONTEXT_DRAWER,
} from './caseDetailData'
import { ApprovalDecisionModal } from './overlays/ApprovalDecisionModal'
import { ApprovalRequestModal } from './overlays/ApprovalRequestModal'
import { ExternalCompletionModal } from './overlays/ExternalCompletionModal'
import { LinkReissueModal, type ReissueSubmission } from './overlays/LinkReissueModal'
import { LinkReissuedModal } from './overlays/LinkReissuedModal'
import { RejectionReasonModal } from './overlays/RejectionReasonModal'

type ApprovalOverlay = 'none' | 'request' | 'decision' | 'rejection'
type CompletionOverlay = 'none' | 'external'
type LinkOverlay = 'none' | 'reissue' | 'reissued'

const CASE_TAB_ITEMS = CASE_TABS.map((label) => ({ id: label, label }))

function getApprovalBadge(status: import('../../api/tasks').TaskStatus): {
  label: string
  tone: StatusTone
} | null {
  if (status === 'READY_FOR_REVIEW') return { label: '승인 대기', tone: 'warning' }
  if (status === 'APPROVED' || status === 'WAITING_WORKER' || status === 'WAITING_EXTERNAL') {
    return { label: '승인 완료', tone: 'success' }
  }
  return null
}

const EVIDENCE_TYPE_BY_LABEL: Record<string, EvidenceType> = {
  접수번호: 'RECEIPT',
  파일: 'DOCUMENT',
  '화면 캡처': 'OFFICIAL_RESULT',
}

export function CaseDetailPage() {
  const { taskId } = useParams()
  const [activeTab, setActiveTab] = useState(CASE_TABS[0])
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [contextDrawerOpen, setContextDrawerOpen] = useState(false)
  const [approvalOverlay, setApprovalOverlay] = useState<ApprovalOverlay>('none')
  const [completionOverlay, setCompletionOverlay] = useState<CompletionOverlay>('none')
  const [actionPending, setActionPending] = useState(false)
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null)
  const [linkOverlay, setLinkOverlay] = useState<LinkOverlay>('none')
  const [lastReissue, setLastReissue] = useState<ReissueSubmission | null>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const showToast = useToastStore((state) => state.showToast)

  const taskFetcher = useCallback(() => fetchTaskById(taskId ?? ''), [taskId])
  const { status: taskStatus, data: task, error: taskError, refetch: refetchTask } = useApiQuery(taskFetcher)

  const activitiesFetcher = useCallback(() => fetchTaskActivities(taskId ?? ''), [taskId])
  const { data: activities } = useApiQuery(activitiesFetcher)
  const activityRows = activities ?? []

  const readinessFetcher = useCallback(() => fetchDocumentReadiness(taskId ?? ''), [taskId])
  const { data: readiness } = useApiQuery(readinessFetcher)

  const workerId = task?.worker_id
  const documentsFetcher = useCallback(() => {
    if (!workerId) return Promise.resolve({ items: [], page: 0, size: 0, total_elements: 0 })
    return fetchDocuments({ workerId, size: 100 })
  }, [workerId])
  const {
    status: documentsStatus,
    data: documentsPage,
    error: documentsError,
    refetch: refetchDocuments,
  } = useApiQuery(
    documentsFetcher,
    useCallback((page: { items: unknown[] }) => page.items.length === 0, []),
  )
  const documents = documentsPage?.items ?? []

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

  async function handleSubmitApprovalRequest() {
    if (!task || actionPending) return
    setActionPending(true)
    try {
      await requestTaskApproval(task.task_id, buildTaskApprovalSnapshot(task))
      setApprovalOverlay('none')
      refetchTask()
      showToast('승인을 요청했습니다.')
    } catch (error) {
      showToast(error instanceof ApiError ? getErrorMessage(error) : '승인을 요청하지 못했습니다.')
    } finally {
      setActionPending(false)
    }
  }

  function handleOpenReview() {
    if (task?.status !== 'READY_FOR_REVIEW') return
    setApprovalOverlay('decision')
  }

  async function handleApprove() {
    if (!task || actionPending) return
    setActionPending(true)
    try {
      await approveTask(task.task_id, { expected_version: task.version })
      setApprovalOverlay('none')
      refetchTask()
      showToast('승인했습니다.')
    } catch (error) {
      showToast(error instanceof ApiError ? getErrorMessage(error) : '승인하지 못했습니다.')
    } finally {
      setActionPending(false)
    }
  }

  function handleStartReject() {
    setApprovalOverlay('rejection')
  }

  async function handleConfirmReject(reason: string) {
    if (!task || actionPending) return
    setActionPending(true)
    try {
      await rejectTask(task.task_id, { expected_version: task.version, reason })
      setApprovalOverlay('none')
      refetchTask()
      showToast('반려했습니다.')
    } catch (error) {
      showToast(error instanceof ApiError ? getErrorMessage(error) : '반려하지 못했습니다.')
    } finally {
      setActionPending(false)
    }
  }

  function handleOpenExternalCompletion() {
    if (!task || !['APPROVED', 'WAITING_WORKER', 'WAITING_EXTERNAL'].includes(task.status)) return
    setCompletionOverlay('external')
  }

  async function handleCompleteExternal(evidenceType: string, evidenceValue: string, memo: string) {
    if (!task || actionPending) return
    const normalizedEvidenceType = EVIDENCE_TYPE_BY_LABEL[evidenceType]
    if (!normalizedEvidenceType) return
    setActionPending(true)
    try {
      const evidence = await recordTaskEvidence(task.task_id, {
        evidence_type: normalizedEvidenceType,
        note: [evidenceValue.trim(), memo.trim()].filter(Boolean).join(' · '),
      })
      await completeTask(task.task_id, evidence.task_version)
      setCompletionOverlay('none')
      refetchTask()
      showToast('업무를 완료했습니다.')
    } catch (error) {
      showToast(error instanceof ApiError ? getErrorMessage(error) : '업무를 완료하지 못했습니다.')
    } finally {
      setActionPending(false)
    }
  }

  function handleMoreActions() {
    setMoreMenuOpen((open) => !open)
  }

  async function handleToggleChecklistItem(itemId: string, completed: boolean, itemVersion: number) {
    if (!task) return
    setTogglingItemId(itemId)
    try {
      await updateChecklistItem(task.task_id, itemId, {
        completed,
        expected_version: itemVersion,
        expected_task_version: task.version,
      })
      await refetchTask()
    } catch (error) {
      showToast(error instanceof ApiError ? getErrorMessage(error) : '체크리스트를 수정하지 못했습니다.')
    } finally {
      setTogglingItemId(null)
    }
  }

  async function handleCancelCase() {
    setMoreMenuOpen(false)
    if (!task) return
    const reason = window.prompt('취소 사유를 입력해 주세요.')
    if (!reason || !reason.trim()) return
    try {
      await cancelTask(task.task_id, { expected_version: task.version, reason: reason.trim() })
      await refetchTask()
      showToast('업무를 취소했습니다.')
    } catch {
      showToast('업무를 취소하지 못했습니다.')
    }
  }

  function handleReassignCase() {
    // TODO(backend): PATCH /api/work-items/:id/assignee -> 담당자 변경
    setMoreMenuOpen(false)
  }

  function handleExpandContext() {
    setContextDrawerOpen(true)
  }

  async function handleSaveDocumentRequestDraft() {
    if (!task || !readiness) return
    try {
      await upsertDocumentRequestDraft(task.task_id, {
        language: 'ko',
        document_types: [...readiness.missing, ...readiness.expired],
        expected_version: 0,
      })
      showToast('서류 요청 초안을 저장했습니다.')
    } catch {
      showToast('서류 요청 초안을 저장하지 못했습니다.')
    }
  }

  function handleOpenLinkReissue() {
    setLinkOverlay('reissue')
  }

  function handleSubmitLinkReissue(submission: ReissueSubmission) {
    // TODO(backend): POST /api/v1/tasks/:taskId/worker-link { rotateExisting: true } (feat/7-worker-link, 미병합)
    setLastReissue(submission)
    setLinkOverlay('reissued')
  }

  if (taskStatus === 'loading') {
    return (
      <div className={styles.stateWrap}>
        <EmptyState
          kind="loading"
          title="업무 정보를 불러오는 중입니다"
          body="잠시만 기다려 주세요."
          note="처리 중 · 중복 실행 차단"
        />
      </div>
    )
  }

  if (taskStatus === 'error' || !task) {
    return (
      <div className={styles.stateWrap}>
        <EmptyState
          kind="error"
          title="업무 정보를 불러오지 못했습니다"
          body={taskError ? getErrorMessage(taskError) : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'}
          actionLabel="다시 시도"
          onAction={refetchTask}
        />
      </div>
    )
  }

  const taskDue = getOperationalDateViewModel('TASK_DUE', task.due_date)
  const approvalBadge = getApprovalBadge(task.status)
  const requiredChecklist = task.checklist_items.filter((item) => item.required)
  const completedRequiredChecklist = requiredChecklist.filter((item) => item.completed).length
  const checklistReady = completedRequiredChecklist === requiredChecklist.length
  const informationReady = task.missing_required_slots.length === 0
  const documentsReady = readiness ? !readiness.completion_blocked : false
  const approvalReady = task.status === 'APPROVED' || task.status === 'WAITING_WORKER' || task.status === 'WAITING_EXTERNAL'
  const canRequestApproval =
    (task.status === 'DRAFT' || task.status === 'NEEDS_INFO') &&
    checklistReady &&
    informationReady &&
    documentsReady
  const canComplete = approvalReady && checklistReady && informationReady && documentsReady
  const completionBlockers = [
    !approvalReady && '승인',
    !checklistReady && '필수 체크리스트',
    !informationReady && '필수 정보',
    !documentsReady && '서류 준비',
  ].filter(Boolean) as string[]

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
        <h1 className={styles.title}>{task.title}</h1>
        <StatusLabel tone={TASK_STATUS_TONE[task.status]}>{TASK_STATUS_LABEL[task.status]}</StatusLabel>
        {approvalBadge && <StatusLabel tone={approvalBadge.tone}>{approvalBadge.label}</StatusLabel>}
        <StatusLabel tone="info">{TASK_SOURCE_LABEL[task.source]}</StatusLabel>
      </div>
      <p className={styles.meta}>
        {taskDue.display} · {task.workflow_id}
      </p>

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
                <h2 className={styles.cardTitle}>현재 업무 상태</h2>
                <StatusLabel tone={TASK_STATUS_TONE[task.status]}>
                  {TASK_STATUS_LABEL[task.status]}
                </StatusLabel>
              </div>
              <p className={styles.gatesDescription}>
                서버에 저장된 현재 Task와 체크리스트만 표시합니다. 고정된 예시 단계는 사용하지 않습니다.
              </p>
              <div className={styles.currentStateRows}>
                <DetailRow label="업무 출처" value={TASK_SOURCE_LABEL[task.source]} />
                <DetailRow label={taskDue.label} value={taskDue.display} />
                <DetailRow
                  label="필수 체크리스트"
                  value={`${completedRequiredChecklist} / ${requiredChecklist.length}`}
                  tone={checklistReady ? 'success' : 'warning'}
                />
                <DetailRow
                  label="필수 정보"
                  value={informationReady ? '모두 입력됨' : `${task.missing_required_slots.length}개 보완 필요`}
                  tone={informationReady ? 'success' : 'critical'}
                />
              </div>
              {approvalReady && (
                <button type="button" className={styles.contextLink} onClick={handleOpenLinkReissue}>
                  근로자 보안 링크 발급·재발급 →
                </button>
              )}
            </div>

            <div className={styles.gatesCard}>
              <h2 className={styles.cardTitle}>완료 조건</h2>
              <p className={styles.gatesDescription}>현재 서버 상태와 필수 조건을 기준으로 확인합니다.</p>

              <DetailRow
                label="승인"
                value={approvalReady ? '완료' : task.status === 'READY_FOR_REVIEW' ? '검토 대기' : '승인 전'}
                tone={approvalReady ? 'success' : 'warning'}
              />
              <DetailRow
                label="필수 체크리스트"
                value={`${completedRequiredChecklist} / ${requiredChecklist.length}`}
                tone={checklistReady ? 'success' : 'warning'}
              />
              <DetailRow
                label="서류 준비"
                value={
                  !readiness
                    ? '확인 중'
                    : readiness.completion_blocked
                      ? `누락 ${readiness.missing.length}건 · 만료 ${readiness.expired.length}건`
                      : '모두 확인됨'
                }
                tone={!readiness ? 'default' : readiness.completion_blocked ? 'critical' : 'success'}
              />

              {canComplete ? (
                <button type="button" className={styles.contextLink} onClick={handleOpenExternalCompletion}>
                  완료 처리 시작 →
                </button>
              ) : task.status === 'COMPLETED' ? (
                <p className={styles.gateComplete}>완료 처리되었습니다.</p>
              ) : (
                <p className={styles.gateBlocked}>
                  완료 처리 불가 · {completionBlockers.join(' · ') || '현재 상태 확인 필요'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === '체크리스트' && (
        <div id="case-panel-1" role="tabpanel" aria-labelledby="case-tab-1" className={styles.tabPanel}>
          {task.checklist_items.length === 0 ? (
            <EmptyState kind="empty" title="체크리스트가 없습니다" body="이 workflow에는 등록된 체크리스트가 없습니다." />
          ) : (
            <div className={styles.checklist}>
              {task.checklist_items.map((item) => (
                <button
                  key={item.checklist_item_id}
                  type="button"
                  className={styles.checklistRow}
                  disabled={togglingItemId === item.checklist_item_id}
                  onClick={() =>
                    handleToggleChecklistItem(item.checklist_item_id, !item.completed, item.version)
                  }
                >
                  <span
                    className={`${styles.checklistMark} ${
                      item.completed ? styles.checklistMarkDone : ''
                    }`}
                    aria-hidden="true"
                  >
                    {item.completed ? '✓' : ''}
                  </span>
                  <span
                    className={`${styles.checklistLabel} ${
                      item.completed ? styles.checklistLabelDone : ''
                    }`}
                  >
                    {item.label}
                    {item.required ? '' : ' (선택)'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === '문서' && (
        <div id="case-panel-2" role="tabpanel" aria-labelledby="case-tab-2" className={styles.tabPanel}>
          {documentsStatus === 'loading' && (
            <EmptyState kind="loading" title="서류 목록을 불러오는 중입니다" body="잠시만 기다려 주세요." />
          )}
          {documentsStatus === 'error' && (
            <EmptyState
              kind="error"
              title="서류 목록을 불러오지 못했습니다"
              body={documentsError ? getErrorMessage(documentsError) : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'}
              actionLabel="다시 시도"
              onAction={refetchDocuments}
            />
          )}
          {documentsStatus === 'empty' && (
            <EmptyState kind="empty" title="등록된 서류가 없습니다" body="근로자가 서류를 제출하면 여기에 표시됩니다." />
          )}
          {documentsStatus === 'success' && (
            <div className={styles.documentList}>
              {documents.map((document) => {
                const view = getDocumentViewModel(document)
                return (
                  <div key={view.id} className={styles.documentRow}>
                    <span className={styles.documentName}>{view.typeLabel}</span>
                    <StatusLabel tone={view.statusTone}>{view.statusLabel}</StatusLabel>
                    <span className={styles.documentUpdatedAt}>{view.expiry.display}</span>
                  </div>
                )
              })}
            </div>
          )}
          {readiness && (readiness.missing.length > 0 || readiness.expired.length > 0) && (
            <button type="button" className={styles.contextLink} onClick={handleSaveDocumentRequestDraft}>
              요청 초안 저장 →
            </button>
          )}
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
          {activityRows.length === 0 ? (
            <EmptyState kind="empty" title="활동 이력이 없습니다" body="업무가 진행되면 여기에 표시됩니다." />
          ) : (
            <div className={styles.timeline}>
              {activityRows.map((entry, index) => (
                <div key={entry.audit_event_id} className={styles.timelineRow}>
                  <span className={styles.timelineDate}>{formatEventTime(entry.created_at)}</span>
                  <span
                    className={`${styles.timelineDot} ${index === 0 ? styles.timelineDotHighlighted : ''}`}
                  />
                  <span className={styles.timelineLabel}>
                    {entry.change_summary ?? AUDIT_ACTION_LABEL[entry.action]}
                  </span>
                  <AgentSourceLabel source={ACTOR_TYPE_TO_AGENT_SOURCE[entry.actor_type]} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={styles.actionDock}>
        <span className={styles.nextStep}>
          {task.status === 'READY_FOR_REVIEW'
            ? '다음 행동 · 승인 검토'
            : task.status === 'COMPLETED'
              ? '이 업무는 완료되었습니다.'
              : task.status === 'CANCELLED'
                ? '이 업무는 취소되었습니다.'
                : approvalReady
                  ? '다음 행동 · 실행 결과와 증빙 확인'
                  : '다음 행동 · 필수 조건 확인 후 승인 요청'}
        </span>
        {task.status === 'READY_FOR_REVIEW' && (
          <Button onClick={handleOpenReview} disabled={actionPending}>승인 검토</Button>
        )}
        {(task.status === 'DRAFT' || task.status === 'NEEDS_INFO') && (
          <Button onClick={handleOpenApprovalRequest} disabled={!canRequestApproval || actionPending}>
            승인 요청
          </Button>
        )}
        {canComplete && (
          <Button onClick={handleOpenExternalCompletion} disabled={actionPending}>완료 처리</Button>
        )}
      </div>

      <p className={styles.footnote}>
        승인·반려·완료 결과는 서버 응답 후 Task를 다시 조회해 반영합니다. 화면에서 성공 상태를 임의로 만들지 않습니다.
      </p>

      <ApprovalRequestModal
        open={approvalOverlay === 'request'}
        taskTitle={task.title}
        dueDate={task.due_date}
        submitting={actionPending}
        onClose={() => setApprovalOverlay('none')}
        onSubmit={handleSubmitApprovalRequest}
      />
      <ApprovalDecisionModal
        open={approvalOverlay === 'decision'}
        taskTitle={task.title}
        dueDate={task.due_date}
        workflowId={task.workflow_id}
        submitting={actionPending}
        onClose={() => setApprovalOverlay('none')}
        onApprove={handleApprove}
        onReject={handleStartReject}
      />
      <RejectionReasonModal
        open={approvalOverlay === 'rejection'}
        onBack={() => setApprovalOverlay('decision')}
        onConfirm={handleConfirmReject}
      />
      <ExternalCompletionModal
        open={completionOverlay === 'external'}
        onClose={() => setCompletionOverlay('none')}
        onComplete={handleCompleteExternal}
      />
      <LinkReissueModal
        open={linkOverlay === 'reissue'}
        taskTitle={task.title}
        onClose={() => setLinkOverlay('none')}
        onSubmit={handleSubmitLinkReissue}
      />
      <LinkReissuedModal
        open={linkOverlay === 'reissued'}
        submission={lastReissue}
        onClose={() => setLinkOverlay('none')}
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
            {activityRows.slice(0, 3).map((entry, index) => (
              <div key={entry.audit_event_id} className={styles.timelineRow}>
                <span className={styles.timelineDate}>{formatEventTime(entry.created_at)}</span>
                <span
                  className={`${styles.timelineDot} ${index === 0 ? styles.timelineDotHighlighted : ''}`}
                />
                <span className={styles.timelineLabel}>
                  {entry.change_summary ?? AUDIT_ACTION_LABEL[entry.action]}
                </span>
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
