import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button/Button'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useToastStore } from '../../store/toastStore'
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
import styles from './WorkListPage.module.css'

interface WorkInboxDetailProps {
  group: WorkInboxWorkerGroup
  onOpenTask: (taskId: string) => void
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

function getWorkerMeta(group: WorkInboxWorkerGroup): string {
  const worker = group.worker
  if (!worker) return '근무 정보 확인 필요'
  const nationality = NATIONALITY_LABEL[worker.nationality_code] ?? worker.nationality_code
  const workStatus = worker.work_status === 'ACTIVE' ? '재직' : '근무 상태 확인 필요'
  return `${nationality} · ${workStatus} · 비자·근무 정보 미등록`
}

export function WorkInboxDetail({ group, onOpenTask }: WorkInboxDetailProps) {
  const showToast = useToastStore((state) => state.showToast)
  const [activeCaseId, setActiveCaseId] = useState(group.primaryCase.case_id)

  // 근로자를 바꾸면 새 근로자의 우선 Case로 되돌린다.
  useEffect(() => {
    setActiveCaseId(group.primaryCase.case_id)
  }, [group.workerId, group.primaryCase.case_id])

  const activeCaseIndex = group.cases.findIndex((item) => item.case_id === activeCaseId)
  const activeCase = group.cases[activeCaseIndex] ?? group.primaryCase
  const activeTask = activeCase.current_task
  const due = getDuePresentation(activeTask?.due_date ?? activeCase.due_date)
  const activeStatus = getCaseDisplayStatusPresentation(activeCase.display_status)
  const reviewCases = group.cases.filter((item) => isReviewCase(item.display_status))
  const detailTitleId = `work-inbox-detail-${group.workerId}`

  function handleOpenOtherCase() {
    const nextIndex = (Math.max(activeCaseIndex, 0) + 1) % group.cases.length
    setActiveCaseId(group.cases[nextIndex].case_id)
  }

  function handleViewEvidence() {
    showToast('판단 근거 보기는 준비 중입니다.')
  }

  function handleOpenWorkerMenu() {
    showToast('근로자 업무 메뉴는 준비 중입니다.')
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
            aria-label={`${group.workerDisplayName} 업무 메뉴`}
            onClick={handleOpenWorkerMenu}
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
              우선 업무 건 · {Math.max(activeCaseIndex, 0) + 1}/{group.cases.length}
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
            {group.cases.length > 1 && (
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
            <button type="button" className={styles.textLink} onClick={handleViewEvidence}>
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
              진행 업무 건 {group.cases.length}개 · 확인할 업무 {reviewCases.length}개 · 자동
              확정되지 않음
            </p>
          </div>
        </section>
      </div>
    </section>
  )
}
