import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
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
import {
  fetchDocumentReadiness,
  fetchDocuments,
  upsertDocumentRequestDraft,
} from '../../api/documents'
import { ApiError, getErrorMessage } from '../../api/errors'
import { cancelTask, fetchTaskById, updateChecklistItem } from '../../api/tasks'
import {
  fetchTaskWorkerResponses,
  issueWorkerLink,
  markTaskWorkerResponsesRead,
  resolveWorkerPortalUrl,
  type WorkerResponseType,
} from '../../api/workerLinks'
import { AgentSourceLabel } from '../../components/ui/AgentSourceLabel/AgentSourceLabel'
import { AgentSummary } from '../../components/ui/AgentSummary/AgentSummary'
import { Button } from '../../components/ui/Button/Button'
import { DetailRow } from '../../components/ui/DetailRow/DetailRow'
import { Drawer } from '../../components/ui/Drawer/Drawer'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { StatusLabel, type StatusTone } from '../../components/ui/StatusLabel/StatusLabel'
import { Tabs } from '../../components/ui/Tabs/Tabs'
import { useApiQuery } from '../../hooks/useApiQuery'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { ACTOR_TYPE_TO_AGENT_SOURCE, getAuditActionLabel } from '../../utils/auditLabels'
import { formatEventTime } from '../../utils/datetime'
import { TASK_SOURCE_LABEL, TASK_STATUS_LABEL, TASK_STATUS_TONE } from '../../utils/taskStatus'
import { getDocumentViewModel } from '../../view-models/documentViewModel'
import { getOperationalDateViewModel } from '../../view-models/dateViewModel'
import {
  getWorkerRequestStateViewModel,
  type WorkerRequestState,
} from '../../view-models/workerRequestStateViewModel'
import styles from './CaseDetailPage.module.css'
import { CASE_TABS, CONTEXT_DRAWER } from './caseDetailData'
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

const WORKER_RESPONSE_TYPE_LABEL: Record<WorkerResponseType, string> = {
  ACKNOWLEDGED: '확인했습니다',
  QUESTION: '질문',
  NOT_UNDERSTOOD: '이해가 어려워요',
  DOCUMENT_SUBMITTED: '서류 제출',
  DIFFICULT: '진행이 어려워요',
}

const WORKER_REQUEST_STATE_TONE: Record<WorkerRequestState, StatusTone> = {
  DOCUMENT_WAITING: 'neutral',
  REQUEST_SENT: 'info',
  APPROVAL_WAITING: 'warning',
  COMPLETED: 'success',
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
  const [issuedWorkerUrl, setIssuedWorkerUrl] = useState<string | null>(null)
  const [issuedExpiresAt, setIssuedExpiresAt] = useState<string | null>(null)
  const [markingResponsesRead, setMarkingResponsesRead] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const userRole = useAuthStore((state) => state.user?.role)
  const showToast = useToastStore((state) => state.showToast)

  const taskFetcher = useCallback(() => fetchTaskById(taskId ?? ''), [taskId])
  const {
    status: taskStatus,
    data: task,
    error: taskError,
    refetch: refetchTask,
  } = useApiQuery(taskFetcher)

  const activitiesFetcher = useCallback(() => fetchTaskActivities(taskId ?? ''), [taskId])
  const { data: activities, refetch: refetchActivities } = useApiQuery(activitiesFetcher)
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

  const workerResponsesFetcher = useCallback(
    () => fetchTaskWorkerResponses(taskId ?? '', 0, 100),
    [taskId],
  )
  const {
    status: workerResponsesStatus,
    data: workerResponsesPage,
    error: workerResponsesError,
    refetch: refetchWorkerResponses,
  } = useApiQuery(
    workerResponsesFetcher,
    useCallback((page: { items: unknown[] }) => page.items.length === 0, []),
  )
  const workerResponses = workerResponsesPage?.items ?? []

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

  async function handleToggleChecklistItem(
    itemId: string,
    completed: boolean,
    itemVersion: number,
  ) {
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
      showToast(
        error instanceof ApiError ? getErrorMessage(error) : '체크리스트를 수정하지 못했습니다.',
      )
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

  async function handleSubmitLinkReissue(submission: ReissueSubmission) {
    if (!task || actionPending) return
    const expiryHours = submission.expiry === '24시간' ? 24 : submission.expiry === '7일' ? 168 : 72
    setActionPending(true)
    try {
      const issued = await issueWorkerLink(
        task.task_id,
        { expires_in_hours: expiryHours, rotate_existing: true },
        crypto.randomUUID(),
      )
      setLastReissue(submission)
      setIssuedWorkerUrl(resolveWorkerPortalUrl(issued.worker_url, window.location.origin))
      setIssuedExpiresAt(issued.expires_at)
      setLinkOverlay('reissued')
      showToast('보안 링크를 발급했습니다. 아직 자동 전송되지는 않았습니다.')
    } catch (error) {
      showToast(
        error instanceof ApiError ? getErrorMessage(error) : '보안 링크를 발급하지 못했습니다.',
      )
    } finally {
      setActionPending(false)
    }
  }

  async function handleMarkResponsesRead() {
    if (!task || markingResponsesRead) return
    setMarkingResponsesRead(true)
    try {
      await markTaskWorkerResponsesRead(task.task_id)
      refetchWorkerResponses()
      refetchActivities()
      showToast('근로자 응답을 확인 처리했습니다.')
    } catch (error) {
      showToast(
        error instanceof ApiError
          ? getErrorMessage(error)
          : '근로자 응답을 확인 처리하지 못했습니다.',
      )
    } finally {
      setMarkingResponsesRead(false)
    }
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
          body={
            taskError ? getErrorMessage(taskError) : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
          }
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
  const approvalReady =
    task.status === 'APPROVED' ||
    task.status === 'WAITING_WORKER' ||
    task.status === 'WAITING_EXTERNAL'
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
  const firstIncompleteChecklistIndex = task.checklist_items.findIndex((item) => !item.completed)
  const agentHeadline =
    checklistReady && informationReady && documentsReady
      ? `${task.title} 검토 준비가 완료되었습니다.`
      : `${task.title}에 필요한 항목을 확인했습니다.`
  const agentBody = completionBlockers.length
    ? `${completionBlockers.join(' · ')} 확인이 필요합니다.`
    : (task.description ?? '필수 항목과 서류가 모두 준비되었습니다.')
  const unreadWorkerResponseCount = workerResponses.filter((response) => response.unread).length
  const newestWorkerResponse = workerResponses[0]
  const workerRequestState = getWorkerRequestStateViewModel({
    // 링크 발급은 실제 전송이 아니다. 응답이 도착한 경우에만 전송 사실이 확인된 것으로 본다.
    requestSentAt: newestWorkerResponse?.received_at,
    responseReceivedAt: newestWorkerResponse?.received_at,
    responseReadAt:
      newestWorkerResponse && unreadWorkerResponseCount === 0
        ? newestWorkerResponse.received_at
        : null,
    completedAt: task.status === 'COMPLETED' ? task.updated_at : null,
  })

  function handleAgentAction() {
    if (!task) return
    if (task.status === 'READY_FOR_REVIEW') {
      handleOpenReview()
      return
    }
    if (!documentsReady) {
      setActiveTab('문서')
      return
    }
    setActiveTab('체크리스트')
  }

  return (
    <div>
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{task.title}</h1>
          <p className={styles.meta}>
            {taskDue.display} · {TASK_SOURCE_LABEL[task.source]} · {TASK_STATUS_LABEL[task.status]}
          </p>
        </div>
        <div className={styles.headerStatusGroup}>
          <StatusLabel tone={TASK_STATUS_TONE[task.status]}>
            {TASK_STATUS_LABEL[task.status]}
          </StatusLabel>
          {approvalBadge && (
            <StatusLabel tone={approvalBadge.tone}>{approvalBadge.label}</StatusLabel>
          )}
          <StatusLabel tone="info">{TASK_SOURCE_LABEL[task.source]}</StatusLabel>
        </div>
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
                <button
                  type="button"
                  role="menuitem"
                  className={styles.moreMenuItem}
                  onClick={handleCancelCase}
                >
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
              headline={agentHeadline}
              body={agentBody}
              actionLabel={
                task.status === 'READY_FOR_REVIEW'
                  ? '검토하기'
                  : !documentsReady
                    ? '문서 확인'
                    : '항목 확인'
              }
              onAction={handleAgentAction}
            />

            <div className={styles.contextCard}>
              <p className={styles.contextLabel}>Agent가 참고한 정보</p>
              <p className={styles.contextValues}>
                출처 · {TASK_SOURCE_LABEL[task.source]}
                <br />
                필수 항목 · {completedRequiredChecklist}/{requiredChecklist.length}
                <br />
                필수 정보 ·{' '}
                {informationReady ? '확인' : `${task.missing_required_slots.length}개 부족`}
                <br />
                필요 서류 · {documentsReady ? '확인' : '보완 필요'}
              </p>
              <button type="button" className={styles.contextLink} onClick={handleExpandContext}>
                펼쳐 보기 →
              </button>
            </div>
          </div>

          <div className={styles.panelRow}>
            <div className={styles.workflowCard}>
              <div className={styles.workflowHeader}>
                <h2 className={styles.cardTitle}>업무 진행</h2>
                <p className={styles.workflowNote}>현재 · {TASK_STATUS_LABEL[task.status]}</p>
              </div>
              {task.checklist_items.length === 0 ? (
                <p className={styles.progressEmpty}>이 업무에 등록된 진행 항목이 없습니다.</p>
              ) : (
                <div className={styles.stepList}>
                  {task.checklist_items.map((item, index) => {
                    const isCurrent = !item.completed && index === firstIncompleteChecklistIndex
                    return (
                      <div
                        key={item.checklist_item_id}
                        className={`${styles.step} ${isCurrent ? styles.stepCurrent : ''}`}
                      >
                        <div className={styles.stepMarkerCol}>
                          <span
                            className={`${styles.stepCircle} ${item.completed ? styles.stepCircleDone : isCurrent ? styles.stepCirclePending : styles.stepCircleWaiting}`}
                          >
                            {item.completed ? '✓' : index + 1}
                          </span>
                          {index < task.checklist_items.length - 1 && (
                            <span
                              className={`${styles.connector} ${item.completed ? styles.connectorDone : ''}`}
                            />
                          )}
                        </div>
                        <div className={styles.stepBody}>
                          <div>
                            <p className={styles.stepTitle}>{item.label}</p>
                            <p className={styles.stepActor}>
                              {item.required ? '필수 항목' : '선택 항목'}
                            </p>
                          </div>
                          <span
                            className={`${styles.stepStatus} ${item.completed ? styles.stepStatusDone : isCurrent ? styles.stepStatusPending : styles.stepStatusWaiting}`}
                          >
                            {item.completed ? '완료' : isCurrent ? '현재 · 확인 필요' : '대기'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {approvalReady && (
                <button
                  type="button"
                  className={styles.contextLink}
                  onClick={handleOpenLinkReissue}
                >
                  근로자 보안 링크 발급·재발급 →
                </button>
              )}
            </div>

            <div
              className={`${styles.gatesCard} ${!canComplete && task.status !== 'COMPLETED' ? styles.gatesCardBlocked : ''}`}
            >
              <h2 className={styles.cardTitle}>완료까지 필요한 조건</h2>
              <p className={styles.gatesDescription}>현재 진행을 막는 조건을 먼저 확인하세요.</p>

              <DetailRow
                label="요청문 승인"
                value={
                  approvalReady
                    ? '완료'
                    : task.status === 'READY_FOR_REVIEW'
                      ? '검토 대기'
                      : '승인 전'
                }
                tone={approvalReady ? 'success' : 'warning'}
              />
              <DetailRow
                label="필수 항목"
                value={`${completedRequiredChecklist} / ${requiredChecklist.length}`}
                tone={checklistReady ? 'success' : 'warning'}
              />
              <DetailRow
                label="필요한 서류"
                value={
                  !readiness
                    ? '확인 중'
                    : readiness.completion_blocked
                      ? `누락 ${readiness.missing.length}건 · 만료 ${readiness.expired.length}건`
                      : '모두 확인됨'
                }
                tone={
                  !readiness ? 'default' : readiness.completion_blocked ? 'critical' : 'success'
                }
              />
              <DetailRow
                label="필수 정보"
                value={
                  informationReady
                    ? '모두 확인됨'
                    : `${task.missing_required_slots.length}개 보완 필요`
                }
                tone={informationReady ? 'success' : 'critical'}
              />

              {canComplete ? (
                <button
                  type="button"
                  className={styles.contextLink}
                  onClick={handleOpenExternalCompletion}
                >
                  완료 처리 시작 →
                </button>
              ) : task.status === 'COMPLETED' ? (
                <p className={styles.gateComplete}>완료 처리되었습니다.</p>
              ) : (
                <p className={styles.gateBlocked}>
                  완료 처리 불가 · {completionBlockers.join(' · ') || '현재 상태 확인 필요'} 확인이
                  필요합니다.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === '체크리스트' && (
        <div
          id="case-panel-1"
          role="tabpanel"
          aria-labelledby="case-tab-1"
          className={styles.tabPanel}
        >
          {task.checklist_items.length === 0 ? (
            <EmptyState
              kind="empty"
              title="체크리스트가 없습니다"
              body="이 workflow에는 등록된 체크리스트가 없습니다."
            />
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
        <div
          id="case-panel-2"
          role="tabpanel"
          aria-labelledby="case-tab-2"
          className={styles.tabPanel}
        >
          {documentsStatus === 'loading' && (
            <EmptyState
              kind="loading"
              title="서류 목록을 불러오는 중입니다"
              body="잠시만 기다려 주세요."
            />
          )}
          {documentsStatus === 'error' && (
            <EmptyState
              kind="error"
              title="서류 목록을 불러오지 못했습니다"
              body={
                documentsError
                  ? getErrorMessage(documentsError)
                  : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
              }
              actionLabel="다시 시도"
              onAction={refetchDocuments}
            />
          )}
          {documentsStatus === 'empty' && (
            <EmptyState
              kind="empty"
              title="등록된 서류가 없습니다"
              body="근로자가 서류를 제출하면 여기에 표시됩니다."
            />
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
            <button
              type="button"
              className={styles.contextLink}
              onClick={handleSaveDocumentRequestDraft}
            >
              요청 초안 저장 →
            </button>
          )}
        </div>
      )}

      {activeTab === '소통' && (
        <div
          id="case-panel-3"
          role="tabpanel"
          aria-labelledby="case-tab-3"
          className={styles.tabPanel}
        >
          {workerResponsesStatus === 'loading' && (
            <EmptyState
              kind="loading"
              title="근로자 응답을 불러오는 중입니다"
              body="잠시만 기다려 주세요."
            />
          )}
          {workerResponsesStatus === 'error' && (
            <EmptyState
              kind="error"
              title="근로자 응답을 불러오지 못했습니다"
              body={
                workerResponsesError
                  ? getErrorMessage(workerResponsesError)
                  : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
              }
              actionLabel="다시 시도"
              onAction={refetchWorkerResponses}
            />
          )}
          {(workerResponsesStatus === 'empty' || workerResponsesStatus === 'success') && (
            <>
              <section className={styles.responseOverview} aria-labelledby="worker-response-title">
                <div className={styles.responseOverviewCopy}>
                  <p className={styles.responseEyebrow}>근로자 모바일 요청</p>
                  <div className={styles.responseTitleRow}>
                    <h2 id="worker-response-title" className={styles.responseTitle}>
                      응답 현황
                    </h2>
                    <StatusLabel tone={WORKER_REQUEST_STATE_TONE[workerRequestState.state]}>
                      {workerRequestState.label}
                    </StatusLabel>
                  </div>
                  <p className={styles.responseDescription}>{workerRequestState.description}</p>
                </div>
                {unreadWorkerResponseCount > 0 && userRole !== 'VIEWER' && (
                  <Button
                    variant="secondary"
                    onClick={handleMarkResponsesRead}
                    isLoading={markingResponsesRead}
                  >
                    응답 확인 완료
                  </Button>
                )}
              </section>

              {workerResponses.length === 0 ? (
                <EmptyState
                  kind="empty"
                  title="도착한 근로자 응답이 없습니다"
                  body={
                    issuedWorkerUrl
                      ? '발급한 링크를 근로자에게 전달한 뒤 응답을 기다려 주세요.'
                      : '모바일 링크를 발급하고 근로자에게 직접 전달해 주세요.'
                  }
                />
              ) : (
                <div className={styles.commList} aria-label="근로자 응답 목록">
                  {workerResponses.map((response) => (
                    <article
                      key={response.response_id}
                      className={`${styles.commRow} ${response.unread ? styles.commRowUnread : ''}`}
                    >
                      <div className={styles.commMeta}>
                        <span className={styles.commTime}>
                          {formatEventTime(response.received_at)}
                        </span>
                        <StatusLabel tone={response.unread ? 'warning' : 'neutral'}>
                          {response.unread ? '미확인' : '확인됨'}
                        </StatusLabel>
                      </div>
                      <div className={styles.commContent}>
                        <div className={styles.commHeading}>
                          <span className={styles.commActor}>근로자</span>
                          <span className={styles.commType}>
                            {WORKER_RESPONSE_TYPE_LABEL[response.response_type]}
                          </span>
                        </div>
                        <p className={styles.commMessage}>
                          {response.message?.trim() || '별도 메시지 없이 응답했습니다.'}
                        </p>
                        {response.upload_ids.length > 0 && (
                          <p className={styles.commFiles}>제출 파일 {response.upload_ids.length}개</p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === '활동이력' && (
        <div
          id="case-panel-4"
          role="tabpanel"
          aria-labelledby="case-tab-4"
          className={styles.tabPanel}
        >
          {activityRows.length === 0 ? (
            <EmptyState
              kind="empty"
              title="활동 이력이 없습니다"
              body="업무가 진행되면 여기에 표시됩니다."
            />
          ) : (
            <div className={styles.timeline}>
              {activityRows.map((entry, index) => (
                <div key={entry.audit_event_id} className={styles.timelineRow}>
                  <span className={styles.timelineDate}>{formatEventTime(entry.created_at)}</span>
                  <span
                    className={`${styles.timelineDot} ${index === 0 ? styles.timelineDotHighlighted : ''}`}
                  />
                  <span className={styles.timelineLabel}>
                    {entry.change_summary ?? getAuditActionLabel(entry.action)}
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
          <Button onClick={handleOpenReview} disabled={actionPending}>
            승인 검토
          </Button>
        )}
        {(task.status === 'DRAFT' || task.status === 'NEEDS_INFO') && (
          <Button
            onClick={handleOpenApprovalRequest}
            disabled={!canRequestApproval || actionPending}
          >
            승인 요청
          </Button>
        )}
        {canComplete && (
          <Button onClick={handleOpenExternalCompletion} disabled={actionPending}>
            완료 처리
          </Button>
        )}
      </div>

      <p className={styles.footnote}>
        {approvalReady
          ? '실제 전달과 외부 제출은 담당자가 직접 수행하고 결과를 증빙으로 남깁니다.'
          : '승인 전에는 근로자 링크 전달이나 외부 처리를 시작할 수 없습니다.'}
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
        workerUrl={issuedWorkerUrl}
        expiresAt={issuedExpiresAt}
        onClose={() => setLinkOverlay('none')}
      />

      <Drawer
        open={contextDrawerOpen}
        onClose={() => setContextDrawerOpen(false)}
        title="관련 Context"
      >
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
                  {entry.change_summary ?? getAuditActionLabel(entry.action)}
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
