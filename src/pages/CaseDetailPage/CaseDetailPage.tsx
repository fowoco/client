import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  approveTask,
  buildTaskApprovalSnapshot,
  completeTask,
  recordExternalSubmission,
  recordTaskEvidence,
  rejectTask,
  requestTaskApproval,
  type EvidenceType,
} from '../../api/approvals'
import { fetchTaskActivities } from '../../api/audit'
import { fetchCaseProjection, type CaseProjectionResponse } from '../../api/cases'
import {
  fetchDocumentRequestDraft,
  fetchDocumentReadiness,
  fetchDocuments,
  upsertDocumentRequestDraft,
  type DocumentRequestDraftResponse,
  type DocumentType,
} from '../../api/documents'
import { ApiError, getErrorMessage } from '../../api/errors'
import { downloadFile } from '../../api/files'
import { fetchCompanyMembers, type CompanyMemberItemResponse } from '../../api/settings'
import {
  cancelTask,
  changeTaskAssignee,
  fetchTaskById,
  updateChecklistItem,
  type TaskAvailableAction,
  type TaskType,
} from '../../api/tasks'
import { fetchWorkerById } from '../../api/workers'
import {
  adoptWorkerResponseDocuments,
  fetchTaskWorkerLinkDelivery,
  fetchTaskWorkerResponses,
  issueWorkerLink,
  markTaskWorkerResponsesRead,
  markWorkerLinkSent,
  resolveWorkerPortalUrl,
  sendWorkerLinkSms,
  type WorkerLinkDeliveryResponse,
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
import { saveBlobAsFile } from '../../utils/fileDownload'
import { DOCUMENT_TYPE_LABEL } from '../../utils/documentLabels'
import { TASK_SOURCE_LABEL, TASK_STATUS_LABEL, TASK_STATUS_TONE } from '../../utils/taskStatus'
import { getDocumentViewModel } from '../../view-models/documentViewModel'
import { getOperationalDateViewModel } from '../../view-models/dateViewModel'
import {
  buildWorkerGuideReviewMessage,
  getWorkerGuideReviewPresentation,
  getWorkerGuideReviewState,
} from '../../view-models/workerGuideReviewViewModel'
import {
  getWorkerRequestStateViewModel,
  type WorkerRequestState,
} from '../../view-models/workerRequestStateViewModel'
import styles from './CaseDetailPage.module.css'
import { CASE_TABS } from './caseDetailData'
import {
  getCaseDisplayStatusPresentation,
  getTaskStatusPresentation,
  getWorkflowLabel,
} from '../WorkListPage/workInboxPresentation'
import { ApprovalDecisionModal } from './overlays/ApprovalDecisionModal'
import { ApprovalRequestModal } from './overlays/ApprovalRequestModal'
import { AssigneeChangeModal } from './overlays/AssigneeChangeModal'
import {
  ExternalCompletionModal,
  type ExternalCompletionSubmission,
} from './overlays/ExternalCompletionModal'
import { LinkDeliveryConfirmModal } from './overlays/LinkDeliveryConfirmModal'
import { RenewalExecutionModal } from './overlays/RenewalExecutionModal'
import { LinkReissueModal, type ReissueSubmission } from './overlays/LinkReissueModal'
import { LinkReissuedModal } from './overlays/LinkReissuedModal'
import { RejectionReasonModal } from './overlays/RejectionReasonModal'

type ApprovalOverlay = 'none' | 'request' | 'decision' | 'rejection'
type CompletionOverlay = 'none' | 'external'
type LinkOverlay = 'none' | 'reissue' | 'reissued' | 'delivery'
type DeliveryConfirmReturn = 'none' | 'reissued'

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
  SLOT_ANSWERS_SUBMITTED: '요청 정보 답변',
}

const WORKER_REQUEST_STATE_TONE: Record<WorkerRequestState, StatusTone> = {
  DOCUMENT_WAITING: 'neutral',
  REQUEST_SENT: 'info',
  APPROVAL_WAITING: 'warning',
  COMPLETED: 'success',
}

const CASE_LIFECYCLE_LABEL: Record<CaseProjectionResponse['lifecycle_status'], string> = {
  ACTIVE: '진행 중',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

function formatResponseFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const RENEWAL_TASK_TYPES = new Set<TaskType>([
  'RECONTRACT',
  'EMPLOYMENT_PERIOD_EXTENSION',
  'STAY_PERIOD_EXTENSION',
])

const NEXT_ACTION_PRESENTATION: Record<
  TaskAvailableAction,
  { label: string; description: string }
> = {
  RUN_RENEWAL: {
    label: 'Renewal 실행',
    description: 'Agent가 현재 정보와 누락 항목을 다시 확인할 수 있습니다.',
  },
  PROVIDE_REQUIRED_INFORMATION: {
    label: '필수 정보 보완',
    description: '업무 진행에 필요한 정보를 먼저 입력해 주세요.',
  },
  COMPLETE_CHECKLIST: {
    label: '체크리스트 확인',
    description: '남아 있는 필수 체크리스트를 완료해 주세요.',
  },
  REVIEW_OCR: {
    label: 'OCR 결과 검토',
    description: '근로자가 제출한 서류의 OCR 결과를 확인해 주세요.',
  },
  REVIEW_WORKER_GUIDE: {
    label: '근로자 안내문 검토',
    description: '대상 언어와 안내 내용을 확인한 뒤 초안을 저장해 주세요.',
  },
  REVIEW_GENERATED_DOCUMENT: {
    label: '생성 문서 검토',
    description: 'Agent가 만든 문서를 확인한 뒤 승인 절차를 진행해 주세요.',
  },
  REQUEST_APPROVAL: {
    label: '승인 요청',
    description:
      'Agent 결과가 반영되어 기존 승인이 무효화되었습니다. 현재 버전으로 다시 승인받아 주세요.',
  },
  APPROVE: {
    label: '승인 검토',
    description: '담당자가 제출한 현재 업무 버전을 검토해 주세요.',
  },
  ISSUE_WORKER_LINK: {
    label: '근로자 링크 발급',
    description: '승인된 요청을 근로자에게 전달할 보안 링크를 준비해 주세요.',
  },
  REVIEW_WORKER_RESPONSE: {
    label: '근로자 응답 확인',
    description: '근로자가 제출한 답변과 서류를 확인해 주세요.',
  },
  COMPLETE_TASK: {
    label: '완료 처리',
    description: '실행 결과와 증빙을 확인한 뒤 업무를 완료해 주세요.',
  },
}

async function fetchTaskWorkerLinkDeliveryOrNull(
  taskId: string,
): Promise<WorkerLinkDeliveryResponse | null> {
  try {
    return await fetchTaskWorkerLinkDelivery(taskId)
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.code === 'WORKER_LINK_RESOURCE_NOT_FOUND')
    ) {
      return null
    }
    throw error
  }
}

interface DocumentRequestDraftForm {
  taskId: string
  sourceVersion: number | null
  guideReviewRequired: boolean
  dirty: boolean
  language: string
  documentTypes: DocumentType[]
  message: string
}

const GUIDANCE_LANGUAGES = [
  { value: 'ko', label: '한국어' },
  { value: 'vi', label: '베트남어' },
  { value: 'en', label: '영어' },
  { value: 'zh', label: '중국어' },
  { value: 'th', label: '태국어' },
  { value: 'id', label: '인도네시아어' },
  { value: 'km', label: '크메르어' },
  { value: 'mn', label: '몽골어' },
  { value: 'uz', label: '우즈베크어' },
  { value: 'ne', label: '네팔어' },
  { value: 'ky', label: '키르기스어' },
]

function uniqueDocumentTypes(types: DocumentType[]): DocumentType[] {
  return [...new Set(types)]
}

const OCR_SLOT_DOCUMENT_TYPE: Record<string, DocumentType> = {
  passport_number: 'PASSPORT_COPY',
  passport_issue_date: 'PASSPORT_COPY',
  passport_expiry_date: 'PASSPORT_COPY',
  date_of_birth: 'PASSPORT_COPY',
  nationality: 'PASSPORT_COPY',
  full_name: 'PASSPORT_COPY',
  surname: 'PASSPORT_COPY',
  given_names: 'PASSPORT_COPY',
  alien_registration_number: 'ARC',
  visa_type: 'ARC',
  stay_expiry_date: 'ARC',
}

function requestedOcrDocumentTypes(businessData: Record<string, unknown>): DocumentType[] {
  const execution = businessData.renewal_execution
  if (typeof execution !== 'object' || execution === null) return []
  const requestedFields = (execution as Record<string, unknown>).requested_fields
  if (!Array.isArray(requestedFields)) return []

  return uniqueDocumentTypes(
    requestedFields.flatMap((field) => {
      if (typeof field !== 'object' || field === null) return []
      const value = field as Record<string, unknown>
      if (value.source_hint !== 'DOCUMENT_OCR' || typeof value.key !== 'string') return []
      const documentType = OCR_SLOT_DOCUMENT_TYPE[value.key]
      return documentType ? [documentType] : []
    }),
  )
}

function defaultDocumentRequestMessage(documentTypes: DocumentType[]): string {
  if (documentTypes.length === 0) return ''
  return `다음 서류를 제출해 주세요: ${documentTypes
    .map((type) => DOCUMENT_TYPE_LABEL[type])
    .join(', ')}.`
}

async function fetchDocumentRequestDraftOrNull(
  taskId: string,
): Promise<DocumentRequestDraftResponse | null> {
  try {
    return await fetchDocumentRequestDraft(taskId)
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.code === 'DOCUMENT_REQUEST_DRAFT_NOT_FOUND')
    ) {
      return null
    }
    throw error
  }
}

export function CaseDetailPage() {
  const { taskId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const contextRequested = searchParams.get('context') === 'open'
  const [activeTab, setActiveTab] = useState(CASE_TABS[0])
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [renewalOverlayOpen, setRenewalOverlayOpen] = useState(false)
  const [contextDrawerOpen, setContextDrawerOpen] = useState(contextRequested)
  const [approvalOverlay, setApprovalOverlay] = useState<ApprovalOverlay>('none')
  const [completionOverlay, setCompletionOverlay] = useState<CompletionOverlay>('none')
  const [actionPending, setActionPending] = useState(false)
  const [assigneeOverlayOpen, setAssigneeOverlayOpen] = useState(false)
  const [assigneeMembers, setAssigneeMembers] = useState<CompanyMemberItemResponse[]>([])
  const [assigneeMembersLoading, setAssigneeMembersLoading] = useState(false)
  const [assigneeSubmitting, setAssigneeSubmitting] = useState(false)
  const [assigneeErrorMessage, setAssigneeErrorMessage] = useState<string | null>(null)
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null)
  const [linkOverlay, setLinkOverlay] = useState<LinkOverlay>('none')
  const [deliveryConfirmReturn, setDeliveryConfirmReturn] = useState<DeliveryConfirmReturn>('none')
  const [lastReissue, setLastReissue] = useState<ReissueSubmission | null>(null)
  const [issuedWorkerUrl, setIssuedWorkerUrl] = useState<string | null>(null)
  const [issuedExpiresAt, setIssuedExpiresAt] = useState<string | null>(null)
  const [issuedWorkerLinkToken, setIssuedWorkerLinkToken] = useState<string | null>(null)
  const [issuedIdempotencyKey, setIssuedIdempotencyKey] = useState<string | null>(null)
  const [sendingLinkSms, setSendingLinkSms] = useState(false)
  const [linkSmsStatusMessage, setLinkSmsStatusMessage] = useState<string | null>(null)
  const [localWorkerLinkDelivery, setLocalWorkerLinkDelivery] = useState<{
    taskId: string
    data: WorkerLinkDeliveryResponse
  } | null>(null)
  const [markingLinkSent, setMarkingLinkSent] = useState(false)
  const [markingResponsesRead, setMarkingResponsesRead] = useState(false)
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null)
  const [adoptingResponseId, setAdoptingResponseId] = useState<string | null>(null)
  const [savingDocumentRequestDraft, setSavingDocumentRequestDraft] = useState(false)
  const [documentRequestDraftForm, setDocumentRequestDraftForm] =
    useState<DocumentRequestDraftForm | null>(null)
  const [documentRequestDraftVersion, setDocumentRequestDraftVersion] = useState<{
    taskId: string
    version: number
  } | null>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const userRole = useAuthStore((state) => state.user?.role)
  const showToast = useToastStore((state) => state.showToast)

  useEffect(() => {
    if (contextRequested) setContextDrawerOpen(true)
  }, [contextRequested])

  const taskFetcher = useCallback(() => fetchTaskById(taskId ?? ''), [taskId])
  const {
    status: taskStatus,
    data: task,
    error: taskError,
    refetch: refetchTask,
  } = useApiQuery(taskFetcher)

  const workerId = task?.worker_id
  const workerFetcher = useCallback(() => {
    if (!workerId) return Promise.resolve(null)
    return fetchWorkerById(workerId)
  }, [workerId])
  const { status: workerStatus, data: worker } = useApiQuery(workerFetcher)

  const activitiesFetcher = useCallback(() => fetchTaskActivities(taskId ?? ''), [taskId])
  const { data: activities, refetch: refetchActivities } = useApiQuery(activitiesFetcher)
  const activityRows = activities ?? []

  const readinessFetcher = useCallback(() => fetchDocumentReadiness(taskId ?? ''), [taskId])
  const {
    status: readinessStatus,
    data: readiness,
    error: readinessError,
    refetch: refetchReadiness,
  } = useApiQuery(readinessFetcher)

  const documentRequestDraftFetcher = useCallback(() => {
    if (!taskId || userRole === 'VIEWER') return Promise.resolve(null)
    return fetchDocumentRequestDraftOrNull(taskId)
  }, [taskId, userRole])
  const {
    status: documentRequestDraftStatus,
    data: documentRequestDraft,
    error: documentRequestDraftError,
    refetch: refetchDocumentRequestDraft,
  } = useApiQuery(
    documentRequestDraftFetcher,
    useCallback((draft: DocumentRequestDraftResponse | null) => draft === null, []),
  )

  useEffect(() => {
    if (!taskId || !readiness || documentRequestDraftStatus === 'loading') return
    if (documentRequestDraftStatus === 'error') return
    if (workerId && workerStatus !== 'error' && worker?.worker_id !== workerId) return

    const inferredDocumentTypes = uniqueDocumentTypes([
      ...readiness.missing,
      ...readiness.expired,
      ...requestedOcrDocumentTypes(task?.business_data ?? {}),
    ])
    const savedVersion = documentRequestDraft?.version ?? null
    const preferredLanguage = worker?.preferred_language?.trim() || 'ko'
    const guideReviewState = task
      ? getWorkerGuideReviewState(task.business_data)
      : { required: false, failureCode: null, draft: null }
    const guideReviewRequired = guideReviewState.required
    const guideReviewMessage = guideReviewRequired
      ? buildWorkerGuideReviewMessage(guideReviewState.draft)
      : ''
    const guideReviewLanguage = guideReviewRequired
      ? (guideReviewState.draft?.targetLanguage ?? preferredLanguage)
      : preferredLanguage

    setDocumentRequestDraftForm((current) => {
      if (documentRequestDraft) {
        if (current?.taskId === taskId && current.sourceVersion === savedVersion && current.dirty) {
          return current
        }
        return {
          taskId,
          sourceVersion: savedVersion,
          guideReviewRequired,
          dirty: false,
          language: documentRequestDraft.language,
          documentTypes: documentRequestDraft.document_types,
          message: documentRequestDraft.message ?? '',
        }
      }
      if (
        current?.taskId === taskId &&
        current.sourceVersion === null &&
        current.guideReviewRequired === guideReviewRequired
      ) {
        const documentTypes = uniqueDocumentTypes([
          ...current.documentTypes,
          ...inferredDocumentTypes,
        ])
        if (current.dirty) {
          return {
            ...current,
            documentTypes,
          }
        }
        const canUseDefaultMessage = !guideReviewRequired && current.language === 'ko'
        const message =
          current.message &&
          current.message !== defaultDocumentRequestMessage(current.documentTypes)
            ? current.message
            : guideReviewMessage
              ? guideReviewMessage
              : canUseDefaultMessage
                ? defaultDocumentRequestMessage(documentTypes)
                : ''
        return {
          ...current,
          language: guideReviewState.draft?.targetLanguage ?? current.language,
          documentTypes,
          message,
        }
      }
      return {
        taskId,
        sourceVersion: null,
        guideReviewRequired,
        dirty: false,
        language: guideReviewLanguage,
        documentTypes: inferredDocumentTypes,
        message:
          guideReviewMessage ||
          (!guideReviewRequired && guideReviewLanguage === 'ko'
            ? defaultDocumentRequestMessage(inferredDocumentTypes)
            : ''),
      }
    })
    setDocumentRequestDraftVersion((current) => {
      if (!documentRequestDraft) return null
      if (current?.taskId === taskId && current.version === documentRequestDraft.version) {
        return current
      }
      return { taskId, version: documentRequestDraft.version }
    })
  }, [
    documentRequestDraft,
    documentRequestDraftStatus,
    readiness,
    task,
    taskId,
    worker,
    workerId,
    workerStatus,
  ])
  const documentsFetcher = useCallback(() => {
    if (!workerId) return Promise.resolve({ items: [], page: 0, size: 0, total_elements: 0 })
    return fetchDocuments({ workerId, taskId, size: 100 })
  }, [taskId, workerId])
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

  const caseId = task?.case_id
  const caseProjectionFetcher = useCallback(() => {
    if (!caseId || !contextDrawerOpen) return Promise.resolve(null)
    return fetchCaseProjection(caseId)
  }, [caseId, contextDrawerOpen])
  const {
    status: caseProjectionStatus,
    data: caseProjection,
    error: caseProjectionError,
    refetch: refetchCaseProjection,
  } = useApiQuery(
    caseProjectionFetcher,
    useCallback((projection: CaseProjectionResponse | null) => projection === null, []),
  )

  const workerLinkDeliveryFetcher = useCallback(() => {
    if (!taskId || userRole === 'VIEWER') return Promise.resolve(null)
    return fetchTaskWorkerLinkDeliveryOrNull(taskId)
  }, [taskId, userRole])
  const {
    status: workerLinkDeliveryStatus,
    data: workerLinkDelivery,
    error: workerLinkDeliveryError,
    refetch: refetchWorkerLinkDelivery,
  } = useApiQuery(
    workerLinkDeliveryFetcher,
    useCallback((delivery: WorkerLinkDeliveryResponse | null) => delivery === null, []),
  )

  useEffect(() => {
    if (!localWorkerLinkDelivery || !workerLinkDelivery) return
    if (
      localWorkerLinkDelivery.taskId === taskId &&
      workerLinkDelivery.worker_link_id === localWorkerLinkDelivery.data.worker_link_id &&
      (workerLinkDelivery.delivery_status === localWorkerLinkDelivery.data.delivery_status ||
        workerLinkDelivery.delivery_status === 'SENT')
    ) {
      setLocalWorkerLinkDelivery(null)
    }
  }, [localWorkerLinkDelivery, taskId, workerLinkDelivery])

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

  async function handleCompleteExternal(submission: ExternalCompletionSubmission) {
    if (!task || actionPending) return
    const normalizedEvidenceType = EVIDENCE_TYPE_BY_LABEL[submission.evidenceType]
    if (!normalizedEvidenceType) return
    const evidenceValue = submission.evidenceValue.trim()
    const memo = submission.memo.trim()
    let externalSubmissionRecorded = task.status === 'WAITING_EXTERNAL'
    setActionPending(true)
    try {
      if (!externalSubmissionRecorded) {
        await recordExternalSubmission(task.task_id, {
          expected_version: task.version,
          destination: submission.destination,
          safe_reference: evidenceValue,
        })
        externalSubmissionRecorded = true
      }

      const evidence = await recordTaskEvidence(task.task_id, {
        evidence_type: normalizedEvidenceType,
        file_reference:
          normalizedEvidenceType === 'DOCUMENT' || normalizedEvidenceType === 'OFFICIAL_RESULT'
            ? evidenceValue
            : undefined,
        note:
          normalizedEvidenceType === 'RECEIPT'
            ? [evidenceValue, memo].filter(Boolean).join(' · ')
            : memo || undefined,
      })
      await completeTask(task.task_id, evidence.task_version)
      setCompletionOverlay('none')
      refetchTask()
      refetchActivities()
      showToast('업무를 완료했습니다.')
    } catch (error) {
      refetchTask()
      refetchActivities()
      const detail =
        error instanceof ApiError ? getErrorMessage(error) : '업무를 완료하지 못했습니다.'
      showToast(externalSubmissionRecorded ? `외부 제출 기록은 저장됐습니다. ${detail}` : detail)
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

  async function handleReassignCase() {
    setMoreMenuOpen(false)
    setAssigneeOverlayOpen(true)
    setAssigneeMembersLoading(true)
    setAssigneeErrorMessage(null)
    try {
      const response = await fetchCompanyMembers({ activeOnly: true })
      setAssigneeMembers(
        response.items.filter((member) =>
          member.roles?.some((role) => role === 'ADMIN' || role === 'HR'),
        ),
      )
    } catch (error) {
      setAssigneeMembers([])
      setAssigneeErrorMessage(
        error instanceof ApiError ? getErrorMessage(error) : '담당자 목록을 불러오지 못했습니다.',
      )
    } finally {
      setAssigneeMembersLoading(false)
    }
  }

  async function handleChangeAssignee(assigneeId: string) {
    if (!task || assigneeSubmitting) return
    setAssigneeSubmitting(true)
    setAssigneeErrorMessage(null)
    try {
      const updatedTask = await changeTaskAssignee(task.task_id, {
        assignee_id: assigneeId,
        expected_version: task.version,
      })
      setAssigneeOverlayOpen(false)
      refetchTask()
      refetchActivities()
      showToast(`${updatedTask.assignee.display_name}님에게 담당 업무를 변경했습니다.`)
    } catch (error) {
      setAssigneeErrorMessage(
        error instanceof ApiError ? getErrorMessage(error) : '담당자를 변경하지 못했습니다.',
      )
    } finally {
      setAssigneeSubmitting(false)
    }
  }

  function handleExpandContext() {
    setContextDrawerOpen(true)
  }

  async function handleSaveDocumentRequestDraft() {
    if (!task || !documentRequestDraftForm || savingDocumentRequestDraft) return
    const message = documentRequestDraftForm.message.trim()
    if (!message) {
      showToast('근로자에게 표시할 안내문을 입력해 주세요.')
      return
    }
    if (documentRequestDraftForm.documentTypes.length === 0) {
      showToast('요청할 서류가 없습니다.')
      return
    }
    setSavingDocumentRequestDraft(true)
    try {
      const savedDraft = await upsertDocumentRequestDraft(task.task_id, {
        language: documentRequestDraftForm.language,
        document_types: documentRequestDraftForm.documentTypes,
        message,
        expected_version:
          documentRequestDraftVersion?.taskId === task.task_id
            ? documentRequestDraftVersion.version
            : 0,
      })
      setDocumentRequestDraftVersion({ taskId: task.task_id, version: savedDraft.version })
      setDocumentRequestDraftForm((current) =>
        current?.taskId === task.task_id
          ? { ...current, sourceVersion: savedDraft.version, dirty: false, message }
          : current,
      )
      await refetchDocumentRequestDraft()
      showToast('서류 요청 초안을 저장했습니다.')
    } catch (error) {
      showToast(
        error instanceof ApiError
          ? getErrorMessage(error)
          : '서류 요청 초안을 저장하지 못했습니다.',
      )
    } finally {
      setSavingDocumentRequestDraft(false)
    }
  }

  async function handleDownloadDocument(fileId: string, fallbackName: string) {
    if (downloadingFileId) return
    setDownloadingFileId(fileId)
    try {
      const downloaded = await downloadFile(fileId)
      saveBlobAsFile(downloaded.blob, downloaded.file_name ?? fallbackName)
    } catch (error) {
      showToast(
        error instanceof ApiError ? getErrorMessage(error) : '첨부 파일을 내려받지 못했습니다.',
      )
    } finally {
      setDownloadingFileId(null)
    }
  }

  function handleOpenLinkReissue() {
    setLinkOverlay('reissue')
  }

  async function handleSubmitLinkReissue(submission: ReissueSubmission) {
    if (!task || actionPending) return
    const expiryHours = submission.expiry === '24시간' ? 24 : submission.expiry === '7일' ? 168 : 72
    const idempotencyKey = crypto.randomUUID()
    setActionPending(true)
    try {
      const issued = await issueWorkerLink(
        task.task_id,
        { expires_in_hours: expiryHours, rotate_existing: true },
        idempotencyKey,
      )
      setLastReissue(submission)
      setIssuedWorkerUrl(
        issued.worker_url
          ? resolveWorkerPortalUrl(issued.worker_url, window.location.origin)
          : null,
      )
      setIssuedExpiresAt(issued.expires_at)
      setIssuedWorkerLinkToken(issued.worker_link_token)
      setIssuedIdempotencyKey(idempotencyKey)
      setLinkSmsStatusMessage(null)
      setLocalWorkerLinkDelivery({
        taskId: task.task_id,
        data: {
          worker_link_id: issued.worker_link_id,
          link_status: 'ACTIVE',
          delivery_status: issued.delivery_status,
          sent_at: issued.sent_at,
          expires_at: issued.expires_at,
        },
      })
      await Promise.all([refetchTask(), refetchWorkerLinkDelivery(), refetchActivities()])
      setLinkOverlay('reissued')
      showToast(
        issued.worker_url
          ? '보안 링크를 발급했습니다. 아직 자동 전송되지는 않았습니다.'
          : '링크는 이미 발급됐지만 보안상 원문을 다시 표시할 수 없습니다.',
      )
    } catch (error) {
      showToast(
        error instanceof ApiError ? getErrorMessage(error) : '보안 링크를 발급하지 못했습니다.',
      )
    } finally {
      setActionPending(false)
    }
  }

  function handleOpenDeliveryConfirm(returnTo: DeliveryConfirmReturn = 'none') {
    setDeliveryConfirmReturn(returnTo)
    setLinkOverlay('delivery')
  }

  async function handleMarkLinkSent() {
    if (!task || markingLinkSent) return
    const currentDelivery =
      localWorkerLinkDelivery?.taskId === task.task_id
        ? localWorkerLinkDelivery.data
        : workerLinkDelivery
    if (!currentDelivery || currentDelivery.delivery_status === 'SENT') return

    setMarkingLinkSent(true)
    try {
      const marked = await markWorkerLinkSent(currentDelivery.worker_link_id)
      setLocalWorkerLinkDelivery({ taskId: task.task_id, data: marked })
      refetchWorkerLinkDelivery()
      refetchActivities()
      setDeliveryConfirmReturn('none')
      setLinkOverlay('none')
      showToast('근로자 링크 전달 완료를 기록했습니다.')
    } catch (error) {
      showToast(
        error instanceof ApiError
          ? getErrorMessage(error)
          : '링크 전달 완료를 기록하지 못했습니다.',
      )
    } finally {
      setMarkingLinkSent(false)
    }
  }

  async function handleSendLinkSms(recipientPhone: string) {
    if (!task || sendingLinkSms) return
    const currentDelivery =
      localWorkerLinkDelivery?.taskId === task.task_id
        ? localWorkerLinkDelivery.data
        : workerLinkDelivery
    if (!currentDelivery || !issuedWorkerLinkToken || !issuedIdempotencyKey) return

    setSendingLinkSms(true)
    setLinkSmsStatusMessage(null)
    try {
      const delivered = await sendWorkerLinkSms(
        currentDelivery.worker_link_id,
        { recipient_phone: recipientPhone, worker_link_token: issuedWorkerLinkToken },
        issuedIdempotencyKey,
      )
      setLocalWorkerLinkDelivery({ taskId: task.task_id, data: delivered })
      refetchWorkerLinkDelivery()
      refetchActivities()
      setLinkSmsStatusMessage('문자를 발송했습니다.')
      showToast('근로자에게 링크를 문자로 발송했습니다.')
    } catch (error) {
      setLinkSmsStatusMessage(
        error instanceof ApiError ? getErrorMessage(error) : '문자를 발송하지 못했습니다.',
      )
      refetchWorkerLinkDelivery()
    } finally {
      setSendingLinkSms(false)
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

  async function handleAdoptResponseDocuments(responseId: string) {
    if (!task || adoptingResponseId) return
    setAdoptingResponseId(responseId)
    try {
      await adoptWorkerResponseDocuments(task.task_id, responseId, task.version)
      await Promise.all([
        refetchTask(),
        refetchWorkerResponses(),
        refetchDocuments(),
        refetchReadiness(),
        refetchWorkerLinkDelivery(),
        refetchActivities(),
      ])
      showToast('제출 파일을 공식 근로자 서류로 등록했습니다.')
    } catch (error) {
      showToast(
        error instanceof ApiError
          ? getErrorMessage(error)
          : '제출 파일을 공식 서류로 등록하지 못했습니다.',
      )
    } finally {
      setAdoptingResponseId(null)
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
  const guideReviewState = getWorkerGuideReviewState(task.business_data)
  const guideReview = guideReviewState.required
    ? getWorkerGuideReviewPresentation(guideReviewState.failureCode)
    : null
  const guideReviewDraftAvailable =
    guideReviewState.required && buildWorkerGuideReviewMessage(guideReviewState.draft) !== ''
  const approvalBadge = getApprovalBadge(task.status)
  const requiredChecklist = task.checklist_items.filter((item) => item.required)
  const completedRequiredChecklist = requiredChecklist.filter((item) => item.completed).length
  const checklistReady = completedRequiredChecklist === requiredChecklist.length
  const informationReady = task.missing_required_slots.length === 0
  const documentsReady =
    readinessStatus === 'success' && Boolean(readiness && !readiness.completion_blocked)
  const documentsStateUnknown = readinessStatus === 'loading' || readinessStatus === 'error'
  const isRenewalTask = RENEWAL_TASK_TYPES.has(task.task_type)
  const renewalPrepared =
    !isRenewalTask ||
    (typeof task.business_data.renewal_execution === 'object' &&
      task.business_data.renewal_execution !== null)
  const availableActions = task.available_actions ?? []
  const nextAction = task.next_action ?? null
  const nextActionPresentation = nextAction ? NEXT_ACTION_PRESENTATION[nextAction] : null
  const canRunRenewal = availableActions.includes('RUN_RENEWAL')
  const approvalReady =
    task.status === 'APPROVED' ||
    task.status === 'WAITING_WORKER' ||
    task.status === 'WAITING_EXTERNAL'
  const workerGuideReady =
    documentRequestDraftVersion?.taskId === task.task_id &&
    Boolean(documentRequestDraftForm?.message.trim())
  const taskCompleted = task.status === 'COMPLETED'
  const approvalSatisfied = approvalReady || taskCompleted
  const canRequestApproval = availableActions.includes('REQUEST_APPROVAL')
  const canComplete =
    !taskCompleted && approvalReady && checklistReady && informationReady && documentsReady
  const completionBlockers = [
    !approvalSatisfied && '승인',
    !renewalPrepared && 'Agent 실행',
    !checklistReady && '필수 체크리스트',
    !informationReady && '필수 정보',
    !documentsReady && (documentsStateUnknown ? '서류 상태 확인' : '서류 준비'),
  ].filter(Boolean) as string[]
  const firstIncompleteChecklistIndex = task.checklist_items.findIndex((item) => !item.completed)
  const agentHeadline = taskCompleted
    ? `${task.title} 업무를 완료했습니다.`
    : checklistReady && informationReady && documentsReady
      ? `${task.title} 검토 준비가 완료되었습니다.`
      : `${task.title}에 필요한 항목을 확인했습니다.`
  const agentBody = taskCompleted
    ? '완료 증빙과 처리 이력을 확인할 수 있습니다.'
    : completionBlockers.length
      ? `${completionBlockers.join(' · ')} 확인이 필요합니다.`
      : (task.description ?? '필수 항목과 서류가 모두 준비되었습니다.')
  const unreadWorkerResponseCount = workerResponses.filter((response) => response.unread).length
  const newestWorkerResponse = workerResponses[0]
  const currentWorkerLinkDelivery =
    localWorkerLinkDelivery?.taskId === task.task_id
      ? localWorkerLinkDelivery.data
      : workerLinkDelivery
  const workerRequestState = getWorkerRequestStateViewModel({
    requestSentAt:
      currentWorkerLinkDelivery?.delivery_status === 'SENT'
        ? (currentWorkerLinkDelivery.sent_at ?? newestWorkerResponse?.received_at)
        : newestWorkerResponse?.received_at,
    responseReceivedAt: newestWorkerResponse?.received_at,
    responseReadAt:
      newestWorkerResponse && unreadWorkerResponseCount === 0
        ? newestWorkerResponse.received_at
        : null,
    completedAt: task.status === 'COMPLETED' ? task.updated_at : null,
  })
  const caseDisplayStatus = caseProjection
    ? getCaseDisplayStatusPresentation(caseProjection.display_status)
    : null

  function handleAgentAction() {
    if (!task) return
    if (taskCompleted) {
      setActiveTab('활동이력')
      return
    }
    if (nextAction === 'RUN_RENEWAL') return setRenewalOverlayOpen(true)
    if (nextAction === 'REQUEST_APPROVAL') return handleOpenApprovalRequest()
    if (nextAction === 'APPROVE') return handleOpenReview()
    if (
      nextAction === 'REVIEW_OCR' ||
      nextAction === 'REVIEW_WORKER_GUIDE' ||
      nextAction === 'REVIEW_GENERATED_DOCUMENT'
    ) {
      return setActiveTab('문서')
    }
    if (nextAction === 'ISSUE_WORKER_LINK' || nextAction === 'REVIEW_WORKER_RESPONSE') {
      return setActiveTab('소통')
    }
    if (nextAction === 'COMPLETE_TASK' && canComplete) return handleOpenExternalCompletion()
    if (!documentsReady) {
      setActiveTab('문서')
      return
    }
    setActiveTab('체크리스트')
  }

  function handleCloseContext() {
    setContextDrawerOpen(false)
    if (!searchParams.has('context')) return

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('context')
    setSearchParams(nextParams, { replace: true })
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
              {userRole !== 'VIEWER' && (
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
              )}
              {canRunRenewal && (
                <li role="presentation">
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.moreMenuItem}
                    onClick={() => {
                      setMoreMenuOpen(false)
                      setRenewalOverlayOpen(true)
                    }}
                  >
                    Renewal 실행
                  </button>
                </li>
              )}
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
          {nextActionPresentation && (
            <div className={styles.nextActionNotice} role="status">
              <strong>다음 행동 · {nextActionPresentation.label}</strong>
              <span>{nextActionPresentation.description}</span>
            </div>
          )}
          <div className={styles.summaryRow}>
            <AgentSummary
              headline={agentHeadline}
              body={agentBody}
              actionLabel={
                taskCompleted
                  ? '활동 이력 확인'
                  : nextAction === 'APPROVE'
                    ? '검토하기'
                    : nextAction === 'REQUEST_APPROVAL'
                      ? '승인 준비 확인'
                      : nextActionPresentation
                        ? nextActionPresentation.label
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
              {!checklistReady && (
                <Button
                  variant="secondary"
                  className={styles.workflowAction}
                  onClick={() => setActiveTab('체크리스트')}
                >
                  필수 항목 확인하기
                </Button>
              )}
              {approvalReady && workerGuideReady && (
                <button
                  type="button"
                  className={styles.contextLink}
                  onClick={handleOpenLinkReissue}
                >
                  근로자 보안 링크 발급·재발급 →
                </button>
              )}
              {approvalReady && !workerGuideReady && (
                <button
                  type="button"
                  className={styles.contextLink}
                  onClick={() => setActiveTab('문서')}
                >
                  먼저 근로자 안내 초안 준비 →
                </button>
              )}
            </div>

            <div
              className={`${styles.gatesCard} ${!canComplete && task.status !== 'COMPLETED' ? styles.gatesCardBlocked : ''}`}
            >
              <h2 className={styles.cardTitle}>완료까지 필요한 조건</h2>
              <p className={styles.gatesDescription}>
                {taskCompleted
                  ? '완료 조건과 처리 결과를 확인하세요.'
                  : '현재 진행을 막는 조건을 먼저 확인하세요.'}
              </p>

              <DetailRow
                label="요청문 승인"
                value={
                  approvalSatisfied
                    ? '완료'
                    : task.status === 'READY_FOR_REVIEW'
                      ? '검토 대기'
                      : '승인 전'
                }
                tone={approvalSatisfied ? 'success' : 'warning'}
              />
              <DetailRow
                label="필수 항목"
                value={`${completedRequiredChecklist} / ${requiredChecklist.length}`}
                tone={checklistReady ? 'success' : 'warning'}
              />
              <DetailRow
                label="필요한 서류"
                value={
                  readinessStatus === 'loading'
                    ? '확인 중'
                    : readinessStatus === 'error'
                      ? '조회 실패'
                      : !readiness
                        ? '확인할 정보 없음'
                        : readiness.completion_blocked
                          ? `누락 ${readiness.missing.length}건 · 만료 ${readiness.expired.length}건`
                          : '모두 확인됨'
                }
                tone={
                  readinessStatus === 'error'
                    ? 'critical'
                    : !readiness || readinessStatus === 'loading'
                      ? 'default'
                      : readiness.completion_blocked
                        ? 'critical'
                        : 'success'
                }
              />
              {readinessStatus === 'error' && (
                <div className={styles.readinessError}>
                  <p>
                    {readinessError
                      ? getErrorMessage(readinessError)
                      : '서류 상태를 불러오지 못했습니다.'}
                  </p>
                  <button type="button" className={styles.contextLink} onClick={refetchReadiness}>
                    다시 조회 →
                  </button>
                </div>
              )}
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
          className={`${styles.tabPanel} ${styles.documentTabPanel}`}
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
                const fileId = document.file_id
                return (
                  <div key={view.id} className={styles.documentRow}>
                    <Link
                      className={styles.documentName}
                      to={`/documents/${encodeURIComponent(document.worker_document_id)}`}
                    >
                      {view.typeLabel}
                      {document.source === 'AI_GENERATED' && ' · Agent 생성 초안'}
                      {document.source === 'WORKER_UPLOAD' && ' · 근로자 제출'}
                    </Link>
                    <StatusLabel tone={view.statusTone}>{view.statusLabel}</StatusLabel>
                    <span className={styles.documentUpdatedAt}>{view.expiry.display}</span>
                    {fileId && (
                      <button
                        type="button"
                        className={styles.contextLink}
                        disabled={downloadingFileId !== null}
                        onClick={() => handleDownloadDocument(fileId, view.typeLabel)}
                      >
                        {downloadingFileId === fileId ? '다운로드 중…' : '다운로드'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {userRole !== 'VIEWER' && documentRequestDraftStatus === 'loading' && (
            <p className={styles.documentRequestStatus} role="status">
              저장된 요청 초안을 확인하고 있습니다.
            </p>
          )}
          {userRole !== 'VIEWER' && documentRequestDraftStatus === 'error' && (
            <div className={styles.documentRequestError} role="alert">
              <p>
                {documentRequestDraftError
                  ? getErrorMessage(documentRequestDraftError)
                  : '저장된 요청 초안을 불러오지 못했습니다.'}
              </p>
              <button type="button" onClick={refetchDocumentRequestDraft}>
                다시 시도
              </button>
            </div>
          )}
          {userRole !== 'VIEWER' &&
            documentRequestDraftStatus !== 'error' &&
            documentRequestDraftForm?.taskId === task.task_id &&
            documentRequestDraftForm.documentTypes.length > 0 && (
              <section
                className={styles.documentRequestCard}
                aria-labelledby="document-request-title"
              >
                <div className={styles.documentRequestHeader}>
                  <div>
                    <p className={styles.documentRequestEyebrow}>근로자 모바일 요청</p>
                    <h2 id="document-request-title" className={styles.documentRequestTitle}>
                      서류 요청 초안
                    </h2>
                  </div>
                  <span className={styles.documentRequestVersion}>
                    {documentRequestDraftVersion?.taskId === task.task_id
                      ? `저장본 v${documentRequestDraftVersion.version}`
                      : '새 초안'}
                  </span>
                </div>

                <div className={styles.documentRequestTypes} aria-label="요청 서류">
                  {documentRequestDraftForm.documentTypes.map((type) => (
                    <span key={type}>{DOCUMENT_TYPE_LABEL[type]}</span>
                  ))}
                </div>

                {guideReview && documentRequestDraftVersion?.taskId !== task.task_id && (
                  <div className={styles.documentRequestReview} role="alert">
                    <strong>{guideReview.title}</strong>
                    <p>
                      {guideReview.description}{' '}
                      {guideReviewDraftAvailable
                        ? '자동 생성된 초안의 대상 언어와 내용을 확인·수정해 저장해 주세요.'
                        : '대상 언어를 확인하고 안내문을 직접 작성해 저장해 주세요.'}{' '}
                      저장 전에는 근로자에게 전달되지 않습니다.
                    </p>
                  </div>
                )}

                <label className={styles.documentRequestLabel} htmlFor="document-request-language">
                  안내 언어
                </label>
                <select
                  id="document-request-language"
                  className={styles.documentRequestSelect}
                  value={documentRequestDraftForm.language}
                  onChange={(event) =>
                    setDocumentRequestDraftForm((current) =>
                      current?.taskId === task.task_id
                        ? { ...current, language: event.target.value, dirty: true }
                        : current,
                    )
                  }
                >
                  {!GUIDANCE_LANGUAGES.some(
                    (language) => language.value === documentRequestDraftForm.language,
                  ) && (
                    <option value={documentRequestDraftForm.language}>
                      {documentRequestDraftForm.language}
                    </option>
                  )}
                  {GUIDANCE_LANGUAGES.map((language) => (
                    <option key={language.value} value={language.value}>
                      {language.label}
                    </option>
                  ))}
                </select>

                <label className={styles.documentRequestLabel} htmlFor="document-request-message">
                  근로자 안내문
                </label>
                <textarea
                  id="document-request-message"
                  className={styles.documentRequestTextarea}
                  maxLength={1000}
                  rows={4}
                  value={documentRequestDraftForm.message}
                  onChange={(event) =>
                    setDocumentRequestDraftForm((current) =>
                      current?.taskId === task.task_id
                        ? { ...current, message: event.target.value, dirty: true }
                        : current,
                    )
                  }
                />

                <div className={styles.documentRequestFooter}>
                  <span>{documentRequestDraftForm.message.length}/1000</span>
                  <button
                    type="button"
                    className={styles.documentRequestAction}
                    disabled={savingDocumentRequestDraft}
                    aria-busy={savingDocumentRequestDraft}
                    onClick={handleSaveDocumentRequestDraft}
                  >
                    {savingDocumentRequestDraft ? '저장 중…' : '요청 초안 저장'}
                  </button>
                </div>
              </section>
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
          {(workerResponsesStatus === 'loading' || workerLinkDeliveryStatus === 'loading') && (
            <EmptyState
              kind="loading"
              title="근로자 응답을 불러오는 중입니다"
              body="잠시만 기다려 주세요."
            />
          )}
          {(workerResponsesStatus === 'error' || workerLinkDeliveryStatus === 'error') && (
            <EmptyState
              kind="error"
              title="근로자 요청 상태를 불러오지 못했습니다"
              body={
                workerResponsesError
                  ? getErrorMessage(workerResponsesError)
                  : workerLinkDeliveryError
                    ? getErrorMessage(workerLinkDeliveryError)
                    : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
              }
              actionLabel="다시 시도"
              onAction={() => {
                refetchWorkerResponses()
                refetchWorkerLinkDelivery()
              }}
            />
          )}
          {(workerResponsesStatus === 'empty' || workerResponsesStatus === 'success') &&
            (workerLinkDeliveryStatus === 'empty' || workerLinkDeliveryStatus === 'success') && (
              <>
                <section
                  className={styles.responseOverview}
                  aria-labelledby="worker-response-title"
                >
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
                  {unreadWorkerResponseCount === 0 &&
                    currentWorkerLinkDelivery?.delivery_status === 'NOT_SENT' &&
                    userRole !== 'VIEWER' && (
                      <Button variant="secondary" onClick={() => handleOpenDeliveryConfirm('none')}>
                        전달 완료 기록
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
                            {response.message?.trim() ||
                              (response.response_type === 'SLOT_ANSWERS_SUBMITTED'
                                ? `요청 정보 ${Object.keys(response.answers ?? {}).length}개를 제출했습니다.`
                                : '별도 메시지 없이 응답했습니다.')}
                          </p>
                          {response.uploads.length > 0 && (
                            <div className={styles.responseFiles}>
                              {response.uploads.map((upload) => (
                                <div key={upload.file_id} className={styles.responseFileRow}>
                                  <div className={styles.responseFileCopy}>
                                    <span className={styles.responseFileName}>
                                      {upload.file_name}
                                    </span>
                                    <span className={styles.responseFileMeta}>
                                      {upload.document_type
                                        ? DOCUMENT_TYPE_LABEL[upload.document_type]
                                        : '서류 유형 미확인'}
                                      {' · '}
                                      {formatResponseFileSize(upload.size)}
                                      {upload.adopted ? ' · 공식 서류 등록됨' : ' · 검토 필요'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    className={styles.responseFileAction}
                                    disabled={downloadingFileId !== null}
                                    onClick={() =>
                                      handleDownloadDocument(upload.file_id, upload.file_name)
                                    }
                                  >
                                    {downloadingFileId === upload.file_id ? '받는 중…' : '다운로드'}
                                  </button>
                                </div>
                              ))}
                              {response.response_type === 'DOCUMENT_SUBMITTED' &&
                                response.uploads.some((upload) => !upload.adopted) &&
                                userRole !== 'VIEWER' && (
                                  <button
                                    type="button"
                                    className={styles.adoptDocumentsAction}
                                    disabled={adoptingResponseId !== null}
                                    onClick={() =>
                                      handleAdoptResponseDocuments(response.response_id)
                                    }
                                  >
                                    {adoptingResponseId === response.response_id
                                      ? '등록 중…'
                                      : '확인 후 공식 서류로 등록'}
                                  </button>
                                )}
                            </div>
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
          {nextActionPresentation
            ? `다음 행동 · ${nextActionPresentation.label}`
            : task.status === 'COMPLETED'
              ? '이 업무는 완료되었습니다.'
              : task.status === 'CANCELLED'
                ? '이 업무는 취소되었습니다.'
                : approvalReady
                  ? '다음 행동 · 실행 결과와 증빙 확인'
                  : '다음 행동 · 필수 조건 확인 후 승인 요청'}
        </span>
        {availableActions.includes('APPROVE') && (
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
        {taskCompleted
          ? '완료 증빙과 처리 이력은 활동이력에서 확인할 수 있습니다.'
          : approvalReady
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
      <AssigneeChangeModal
        open={assigneeOverlayOpen}
        currentAssigneeId={task.assignee.user_id}
        members={assigneeMembers}
        loading={assigneeMembersLoading}
        submitting={assigneeSubmitting}
        errorMessage={assigneeErrorMessage}
        onClose={() => {
          if (!assigneeSubmitting) setAssigneeOverlayOpen(false)
        }}
        onSubmit={handleChangeAssignee}
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
        submissionAlreadyRecorded={task.status === 'WAITING_EXTERNAL'}
        submitting={actionPending}
        onClose={() => {
          if (!actionPending) setCompletionOverlay('none')
        }}
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
        canRecordDelivery={
          Boolean(issuedWorkerUrl) && currentWorkerLinkDelivery?.delivery_status === 'NOT_SENT'
        }
        onRecordDelivery={() => handleOpenDeliveryConfirm('reissued')}
        canSendSms={
          Boolean(issuedWorkerLinkToken) &&
          (currentWorkerLinkDelivery?.delivery_status === 'NOT_SENT' ||
            currentWorkerLinkDelivery?.delivery_status === undefined)
        }
        smsSending={sendingLinkSms}
        smsStatusMessage={linkSmsStatusMessage}
        onSendSms={handleSendLinkSms}
        onClose={() => setLinkOverlay('none')}
      />
      <LinkDeliveryConfirmModal
        open={linkOverlay === 'delivery'}
        submitting={markingLinkSent}
        onClose={() => setLinkOverlay(deliveryConfirmReturn)}
        onConfirm={handleMarkLinkSent}
      />

      {task && (
        <RenewalExecutionModal
          open={renewalOverlayOpen}
          taskId={task.task_id}
          taskVersion={task.version}
          onClose={() => setRenewalOverlayOpen(false)}
          onDownloadDocument={handleDownloadDocument}
          onApplied={(result) => {
            if (result.guide_review_required) setActiveTab(CASE_TABS[2])
            refetchTask()
            refetchDocuments()
            refetchActivities()
            refetchReadiness()
            refetchDocumentRequestDraft()
          }}
        />
      )}

      <Drawer open={contextDrawerOpen} onClose={handleCloseContext} title="관련 Context">
        {caseId && (caseProjectionStatus === 'loading' || caseProjectionStatus === 'empty') && (
          <EmptyState
            kind="loading"
            title="Case 정보를 불러오는 중입니다"
            body="연결된 업무와 준비 현황을 확인하고 있습니다."
          />
        )}

        {caseProjectionStatus === 'error' && (
          <EmptyState
            kind="error"
            title="Case 정보를 불러오지 못했습니다"
            body={
              caseProjectionError
                ? getErrorMessage(caseProjectionError)
                : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
            }
            actionLabel="다시 시도"
            onAction={refetchCaseProjection}
          />
        )}

        {!caseId && caseProjectionStatus === 'empty' && (
          <EmptyState
            kind="empty"
            title="연결된 Case가 없습니다"
            body="이 업무는 독립 업무로 등록되어 현재 Task 정보만 표시됩니다."
          />
        )}

        {caseProjectionStatus === 'success' && caseProjection && caseDisplayStatus && (
          <>
            <div className={styles.contextSection}>
              <h3 className={styles.contextSectionTitle}>Case 현황</h3>
              <DetailRow label="근로자" value={caseProjection.worker_display_name} />
              <DetailRow label="Case" value={caseProjection.title} />
              <DetailRow
                label="상태"
                value={
                  <StatusLabel tone={caseDisplayStatus.tone}>{caseDisplayStatus.label}</StatusLabel>
                }
              />
              <DetailRow
                label="생명주기"
                value={CASE_LIFECYCLE_LABEL[caseProjection.lifecycle_status]}
              />
              <DetailRow
                label="진행률"
                value={`${caseProjection.progress.completed_steps} / ${caseProjection.progress.total_steps} · ${caseProjection.progress.percentage}%`}
              />
            </div>

            <div className={styles.contextSection}>
              <h3 className={styles.contextSectionTitle}>준비 현황</h3>
              <DetailRow
                label="체크리스트"
                value={`${caseProjection.readiness.completed_checklist_items} / ${caseProjection.readiness.total_checklist_items}`}
              />
              <DetailRow
                label="검증 서류"
                value={`${caseProjection.readiness.verified_documents} / ${caseProjection.readiness.total_documents}`}
              />
              <DetailRow
                label="승인"
                value={`${caseProjection.readiness.approved_approvals}건 완료 · ${caseProjection.readiness.pending_approvals}건 대기`}
              />
              <DetailRow
                label="근로자 응답"
                value={`${caseProjection.readiness.worker_responses}건`}
              />
              <DetailRow label="완료 증빙" value={`${caseProjection.readiness.evidence_items}건`} />
            </div>

            <div className={styles.contextSection}>
              <h3 className={styles.contextSectionTitle}>연결된 업무</h3>
              {caseProjection.tasks.length === 0 ? (
                <p className={styles.contextEmpty}>연결된 업무가 없습니다.</p>
              ) : (
                caseProjection.tasks.map((caseTask) => {
                  const status = getTaskStatusPresentation(caseTask.status)
                  return (
                    <DetailRow
                      key={caseTask.task_id}
                      label={caseTask.title}
                      value={`${getWorkflowLabel(caseTask)} · ${status.label}`}
                    />
                  )
                })
              )}
            </div>

            <div className={styles.contextSection}>
              <h3 className={styles.contextSectionTitle}>최근 활동</h3>
              {activityRows.length === 0 ? (
                <p className={styles.contextEmpty}>기록된 활동이 없습니다.</p>
              ) : (
                <div className={styles.timeline}>
                  {activityRows.slice(0, 3).map((entry, index) => (
                    <div key={entry.audit_event_id} className={styles.timelineRow}>
                      <span className={styles.timelineDate}>
                        {formatEventTime(entry.created_at)}
                      </span>
                      <span
                        className={`${styles.timelineDot} ${index === 0 ? styles.timelineDotHighlighted : ''}`}
                      />
                      <span className={styles.timelineLabel}>
                        {entry.change_summary ?? getAuditActionLabel(entry.action)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Drawer>
    </div>
  )
}
