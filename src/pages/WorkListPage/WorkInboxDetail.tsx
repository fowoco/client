import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button/Button'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useToastStore } from '../../store/toastStore'
import { getWorkInboxCaseProgress, type WorkInboxWorkerGroup } from './workInboxModel'
import {
  getDecisionSummary,
  getDuePresentation,
  getReviewActionLabel,
  getTaskStatusPresentation,
  getWorkflowLabel,
  isReviewTask,
} from './workInboxPresentation'
import styles from './WorkListPage.module.css'

interface WorkInboxDetailProps {
  group: WorkInboxWorkerGroup
  onOpenTask: (taskId: string) => void
}

export function WorkInboxDetail({ group, onOpenTask }: WorkInboxDetailProps) {
  const showToast = useToastStore((state) => state.showToast)
  const [activeCaseKey, setActiveCaseKey] = useState(group.primaryCase.key)

  // 근로자를 바꾸면 새 근로자의 우선 Case로 되돌린다.
  useEffect(() => {
    setActiveCaseKey(group.primaryCase.key)
  }, [group.worker.worker_id, group.primaryCase.key])

  const activeCaseIndex = group.cases.findIndex((item) => item.key === activeCaseKey)
  const activeCase = group.cases[activeCaseIndex] ?? group.primaryCase
  const activeTask = activeCase.primaryTask
  const progress = getWorkInboxCaseProgress(activeCase)
  const due = getDuePresentation(activeTask.task.due_date)
  const activeStatus = getTaskStatusPresentation(activeTask.task.status)
  const headerStatus = due.tone === 'critical' ? { label: '긴급', tone: 'critical' as const } : activeStatus
  const reviewTasks = group.tasks.filter((item) => isReviewTask(item.task.status))
  const detailTitleId = `work-inbox-detail-${group.worker.worker_id}`

  function handleOpenOtherCase() {
    const nextIndex = (Math.max(activeCaseIndex, 0) + 1) % group.cases.length
    setActiveCaseKey(group.cases[nextIndex].key)
  }

  function handleViewEvidence() {
    showToast('판단 근거 보기는 준비 중입니다.')
  }

  return (
    <section className={styles.detailPanel} role="region" aria-labelledby={detailTitleId}>
      <header className={styles.detailHeader}>
        <div>
          <h2 id={detailTitleId} className={styles.detailName}>
            {group.worker.display_name}
          </h2>
          <p className={styles.detailMeta}>
            국적 코드 {group.worker.nationality_code} · 비자·근무 정보 미제공
          </p>
        </div>
        <StatusLabel tone={headerStatus.tone}>{headerStatus.label}</StatusLabel>
      </header>

      <div className={styles.priorityCase}>
        <div className={styles.sectionHeadingRow}>
          <p className={styles.caseEyebrow}>
            우선 Case {Math.max(activeCaseIndex, 0) + 1}/{group.cases.length}
          </p>
          <button
            type="button"
            className={styles.textLink}
            onClick={() => onOpenTask(activeTask.task.task_id)}
          >
            Case 열기 →
          </button>
        </div>
        {activeCase.caseId && <p className={styles.caseIdentifier}>Case {activeCase.caseId}</p>}
        <h3 className={styles.caseTitle}>{activeTask.task.title}</h3>
        <p className={styles.caseMeta}>
          {getWorkflowLabel(activeTask)} · {due.label} · {activeStatus.label}
        </p>
        <div className={styles.progressRow}>
          <span>
            진행 {progress.completed}/{progress.total}
          </span>
          <progress
            className={styles.progress}
            value={progress.completed}
            max={Math.max(progress.total, 1)}
            aria-label={`${activeTask.task.title} Case 진행률`}
          />
        </div>
        {group.cases.length > 1 && (
          <button type="button" className={styles.textLink} onClick={handleOpenOtherCase}>
            다른 Case 열기 →
          </button>
        )}
      </div>

      <section className={styles.detailSection} aria-labelledby="review-task-title">
        <div className={styles.sectionHeadingRow}>
          <h3 id="review-task-title" className={styles.sectionTitle}>
            검토할 업무
          </h3>
          <span className={styles.sectionCount}>{reviewTasks.length}건</span>
        </div>

        {reviewTasks.length === 0 ? (
          <p className={styles.sectionEmpty}>현재 검토할 업무가 없습니다.</p>
        ) : (
          <div className={styles.reviewTaskList}>
            {reviewTasks.map((item, index) => {
              const taskDue = getDuePresentation(item.task.due_date)
              const taskStatus = getTaskStatusPresentation(item.task.status)
              return (
                <article key={item.task.task_id} className={styles.reviewTaskRow}>
                  <div className={styles.reviewTaskContent}>
                    <h4 className={styles.reviewTaskTitle}>{item.task.title}</h4>
                    <p className={styles.reviewTaskMeta}>
                      {getWorkflowLabel(item)} · {taskStatus.label}
                    </p>
                  </div>
                  <StatusLabel tone={taskDue.tone}>{taskDue.label}</StatusLabel>
                  <Button
                    variant={index === 0 ? 'primary' : 'secondary'}
                    className={styles.reviewTaskButton}
                    onClick={() => onOpenTask(item.task.task_id)}
                  >
                    {getReviewActionLabel(item.task.status)}
                  </Button>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className={styles.decisionSection} aria-labelledby="current-decision-title">
        <div className={styles.sectionHeadingRow}>
          <h3 id="current-decision-title" className={styles.sectionTitle}>
            현재 결정
          </h3>
          <StatusLabel tone={activeStatus.tone}>{activeStatus.label}</StatusLabel>
        </div>
        <p className={styles.decisionSummary}>{getDecisionSummary(activeTask.task.status)}</p>
        <p className={styles.decisionMeta}>
          진행 Case {group.cases.length}개 · 확인할 업무 {reviewTasks.length}개
        </p>
        <button type="button" className={styles.textLink} onClick={handleViewEvidence}>
          근거 보기 →
        </button>
        <p className={styles.dataGapNote}>
          판단 근거와 문서 연결 정보는 현재 API에서 제공되지 않습니다.
        </p>
      </section>
    </section>
  )
}
