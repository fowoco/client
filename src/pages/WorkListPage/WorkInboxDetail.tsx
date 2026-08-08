import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button/Button'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import type { WorkInboxWorkerGroup } from './workInboxModel'
import {
  getCaseDisplayStatusPresentation,
  getDecisionSummary,
  getDuePresentation,
  getReviewActionLabel,
  getTaskStatusPresentation,
  getWorkflowLabel,
  isReviewCase,
} from './workInboxPresentation'
import { isActiveWorkInboxCase } from './workInboxModel'
import styles from './WorkListPage.module.css'

interface WorkInboxDetailProps {
  group: WorkInboxWorkerGroup
  onOpenTask: (taskId: string) => void
  onOpenTaskContext: (taskId: string) => void
  onCreateWork: (workerId: string, workerDisplayName: string) => void
  onOpenWorker: (workerId: string) => void
  onOpenDocuments: (workerId: string) => void
  casesUnavailable?: boolean
}

const NATIONALITY_LABEL: Record<string, string> = {
  VN: '베트남',
  ID: '인도네시아',
  KH: '캄보디아',
  NP: '네팔',
  MM: '미얀마',
  PH: '필리핀',
  TH: '태국',
}

const WORK_STATUS_LABEL = {
  ACTIVE: '재직',
  ON_LEAVE: '휴직',
  RESIGNED: '퇴사',
  TERMINATED: '계약 종료',
} as const

function getWorkerMeta(group: WorkInboxWorkerGroup): string {
  const worker = group.worker
  if (!worker) return '근무 정보 확인 필요'
  const nationality = NATIONALITY_LABEL[worker.nationality_code] ?? worker.nationality_code
  const workStatus = WORK_STATUS_LABEL[worker.work_status]
  const visa = worker.visa_type ? `${worker.visa_type} 비자` : '비자 미등록'
  return `${nationality} · ${workStatus} · ${visa}`
}

export function WorkInboxDetail({
  group,
  onOpenTask,
  onOpenTaskContext,
  onCreateWork,
  onOpenWorker,
  onOpenDocuments,
  casesUnavailable = false,
}: WorkInboxDetailProps) {
  const [activeCaseId, setActiveCaseId] = useState<string | null>(group.primaryCase?.case_id ?? null)

  // 근로자를 바꾸면 새 근로자의 우선 Case로 되돌린다.
  useEffect(() => {
    setActiveCaseId(group.primaryCase?.case_id ?? null)
  }, [group.workerId, group.primaryCase?.case_id])

  const detailTitleId = `work-inbox-detail-${group.workerId}`
  const activeCases = group.cases.filter(isActiveWorkInboxCase)

  if (activeCases.length === 0 || !group.primaryCase) {
    const emptyTitle = casesUnavailable
      ? '업무 정보를 확인하지 못했습니다'
      : '현재 진행 중인 업무가 없습니다'
    const emptyBody = casesUnavailable
      ? '근로자 정보는 불러왔지만 업무 목록 연결에 실패했습니다. 잠시 후 다시 확인해 주세요.'
      : group.historyCaseCount > 0
        ? `완료·취소된 업무 이력 ${group.historyCaseCount}건이 있습니다. 필요한 후속 업무를 새로 요청할 수 있습니다.`
        : '이 근로자에게 필요한 업무를 요청하면 Agent가 절차와 준비 서류를 정리합니다.'

    return (
      <section className={styles.detailPanel} role="region" aria-labelledby={detailTitleId}>
        <header className={styles.detailHeader}>
          <div>
            <h2 id={detailTitleId} className={styles.detailName}>
              {group.workerDisplayName}
            </h2>
            <p className={styles.detailMeta}>{getWorkerMeta(group)}</p>
          </div>
          <button
            type="button"
            className={styles.moreButton}
            aria-label={`${group.workerDisplayName} 근로자 정보 보기`}
            onClick={() => onOpenWorker(group.workerId)}
          >
            <span aria-hidden="true">···</span>
          </button>
        </header>

        <div className={styles.noWorkPanel}>
          <div className={styles.noWorkContent}>
            <span className={styles.noWorkEyebrow}>
              {casesUnavailable ? '업무 연결 확인 필요' : '업무 없음'}
            </span>
            <h3 className={styles.noWorkTitle}>{emptyTitle}</h3>
            <p className={styles.noWorkBody}>{emptyBody}</p>
          </div>
          <div className={styles.noWorkActions}>
            <Button
              disabled={casesUnavailable}
              onClick={() => onCreateWork(group.workerId, group.workerDisplayName)}
            >
              새 업무 요청
            </Button>
            <Button variant="secondary" onClick={() => onOpenWorker(group.workerId)}>
              근로자 정보 보기
            </Button>
            <Button variant="secondary" onClick={() => onOpenDocuments(group.workerId)}>
              문서 확인
            </Button>
          </div>
        </div>
      </section>
    )
  }

  const activeCaseIndex = activeCases.findIndex((item) => item.case_id === activeCaseId)
  const activeCase = activeCases[activeCaseIndex] ?? group.primaryCase
  const activeTask = activeCase.current_task
  const due = getDuePresentation(activeTask?.due_date ?? activeCase.due_date)
  const activeStatus = getCaseDisplayStatusPresentation(activeCase.display_status)
  const reviewCases = activeCases.filter((item) => isReviewCase(item.display_status))

  function handleOpenOtherCase() {
    const nextIndex = (Math.max(activeCaseIndex, 0) + 1) % activeCases.length
    setActiveCaseId(activeCases[nextIndex].case_id)
  }

  function handleViewEvidence() {
    if (activeTask) onOpenTaskContext(activeTask.task_id)
  }

  return (
    <section className={styles.detailPanel} role="region" aria-labelledby={detailTitleId}>
      <header className={styles.detailHeader}>
        <div>
          <h2 id={detailTitleId} className={styles.detailName}>
            {group.workerDisplayName}
          </h2>
          <p className={styles.detailMeta}>{getWorkerMeta(group)}</p>
        </div>
        <div className={styles.detailHeaderActions}>
          <button
            type="button"
            className={styles.moreButton}
            aria-label={`${group.workerDisplayName} 근로자 정보 보기`}
            onClick={() => onOpenWorker(group.workerId)}
          >
            <span aria-hidden="true">···</span>
          </button>
        </div>
      </header>

      <div className={styles.caseSummaryScroll}>
        <p className={styles.agentSuggestion}>
          Agent 제안 · {due.label}, {activeCase.title} 확인 필요
        </p>

        <div className={styles.priorityCase}>
          <div className={styles.priorityCaseHeader}>
            <p className={styles.caseEyebrow}>
              우선 업무 건 · {Math.max(activeCaseIndex, 0) + 1}/{activeCases.length}
            </p>
            {activeTask && (
              <button
                type="button"
                className={styles.textLink}
                onClick={() => onOpenTask(activeTask.task_id)}
              >
                <span>업무 건 열기</span>
                <span className={styles.linkChevron} aria-hidden="true">
                  ›
                </span>
              </button>
            )}
          </div>
          <div className={styles.priorityCaseBody}>
            <span className={styles.srOnly}>Case {activeCase.case_id}</span>
            <h3 className={styles.caseTitle}>{activeTask?.title ?? activeCase.title}</h3>
            <p className={styles.caseMeta}>
              {activeCase.title} · {due.label} · {activeStatus.label}
            </p>
            <div className={styles.progressRow}>
              <span>
                {activeCase.progress.completed_steps}/{activeCase.progress.total_steps}
              </span>
              <progress
                className={styles.progress}
                value={activeCase.progress.completed_steps}
                max={Math.max(activeCase.progress.total_steps, 1)}
                aria-label={`${activeCase.title} Case 진행률`}
              />
            </div>
            {activeCases.length > 1 && (
              <button type="button" className={styles.textLink} onClick={handleOpenOtherCase}>
                다른 Case 열기 →
              </button>
            )}
          </div>
        </div>

        <section className={styles.detailSection} aria-labelledby="review-task-title">
          <div className={styles.sectionHeadingRow}>
            <h3 id="review-task-title" className={styles.sectionTitle}>
              검토할 업무
            </h3>
            <span className={styles.srOnly}>{reviewCases.length}건</span>
          </div>

          {reviewCases.length === 0 ? (
            <p className={styles.sectionEmpty}>현재 검토할 업무가 없습니다.</p>
          ) : (
            <div className={styles.reviewTaskList}>
              {reviewCases.map((item, index) => {
                const task = item.current_task
                const taskDue = getDuePresentation(task?.due_date ?? item.due_date)
                const taskStatus = task ? getTaskStatusPresentation(task.status) : null
                return (
                  <article key={item.case_id} className={styles.reviewTaskRow}>
                    <div className={styles.reviewTaskContent}>
                      <h4 className={styles.reviewTaskTitle}>{task?.title ?? item.title}</h4>
                      <p className={styles.reviewTaskMeta}>
                        {task ? getWorkflowLabel(task) : item.title} ·{' '}
                        {taskStatus?.label ?? getCaseDisplayStatusPresentation(item.display_status).label}
                      </p>
                    </div>
                    <StatusLabel tone={taskDue.tone}>{taskDue.label}</StatusLabel>
                    {task && (
                      <Button
                        variant={index === 0 ? 'primary' : 'secondary'}
                        className={styles.reviewTaskButton}
                        onClick={() => onOpenTask(task.task_id)}
                      >
                        {getReviewActionLabel(task.status)}
                      </Button>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className={styles.decisionSection} aria-labelledby="current-decision-title">
          <div className={styles.decisionHeader}>
            <h3 id="current-decision-title" className={styles.sectionTitle}>
              현재 결정
            </h3>
            <button
              type="button"
              className={styles.textLink}
              onClick={handleViewEvidence}
              disabled={!activeTask}
            >
              <span>근거 보기</span>
              <span className={styles.linkChevron} aria-hidden="true">
                ›
              </span>
            </button>
          </div>
          <div className={styles.decisionBody}>
            <p className={styles.decisionSummary}>
              {activeTask ? getDecisionSummary(activeTask.status) : activeStatus.label}
            </p>
            <p className={styles.decisionMeta}>
              진행 업무 건 {group.activeCaseCount}개 · 확인할 업무 {reviewCases.length}개 · 자동
              확정되지 않음
            </p>
          </div>
        </section>
      </div>
    </section>
  )
}
