import { Button } from '../../components/ui/Button/Button'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
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
  const primaryCase = group.primaryCase
  const primaryTask = primaryCase.primaryTask
  const progress = getWorkInboxCaseProgress(primaryCase)
  const due = getDuePresentation(primaryTask.task.due_date)
  const primaryStatus = getTaskStatusPresentation(primaryTask.task.status)
  const headerStatus =
    due.tone === 'critical' ? { label: '긴급', tone: 'critical' as const } : primaryStatus
  const reviewTasks = group.tasks.filter((item) => isReviewTask(item.task.status))
  const detailTitleId = `work-inbox-detail-${group.worker.worker_id}`

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
          <p className={styles.caseEyebrow}>우선 Case 1/{group.cases.length}</p>
          <button
            type="button"
            className={styles.textLink}
            onClick={() => onOpenTask(primaryTask.task.task_id)}
          >
            Case 열기 →
          </button>
        </div>
        {primaryCase.caseId && <p className={styles.caseIdentifier}>Case {primaryCase.caseId}</p>}
        <h3 className={styles.caseTitle}>{primaryTask.task.title}</h3>
        <p className={styles.caseMeta}>
          {getWorkflowLabel(primaryTask)} · {due.label} · {primaryStatus.label}
        </p>
        <div className={styles.progressRow}>
          <span>
            진행 {progress.completed}/{progress.total}
          </span>
          <progress
            className={styles.progress}
            value={progress.completed}
            max={Math.max(progress.total, 1)}
            aria-label={`${primaryTask.task.title} Case 진행률`}
          />
        </div>
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
          <StatusLabel tone={primaryStatus.tone}>{primaryStatus.label}</StatusLabel>
        </div>
        <p className={styles.decisionSummary}>{getDecisionSummary(primaryTask.task.status)}</p>
        <p className={styles.decisionMeta}>
          진행 Case {group.cases.length}개 · 확인할 업무 {reviewTasks.length}개
        </p>
        <p className={styles.dataGapNote}>
          판단 근거와 문서 연결 정보는 현재 API에서 제공되지 않습니다.
        </p>
      </section>
    </section>
  )
}
