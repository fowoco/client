import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { StatusLabel } from '../../components/ui/StatusLabel/StatusLabel'
import { useToastStore } from '../../store/toastStore'
import { getWorkInboxCaseProgress, type WorkInboxWorkerGroup } from './workInboxModel'
import {
  getDecisionSummary,
  getDuePresentation,
  getReviewActionLabel,
  getReviewStageLink,
  getTaskStatusPresentation,
  getWorkflowLabel,
  isReviewTask,
  REVIEW_STAGE_LINKS,
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
  const nationality =
    NATIONALITY_LABEL[group.worker.nationality_code] ?? group.worker.nationality_code
  const workStatus = group.worker.work_status === 'ACTIVE' ? '재직' : '근무 상태 확인 필요'
  return `${nationality} · ${workStatus} · 비자·근무 정보 미등록`
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
  const reviewStage = getReviewStageLink(activeTask.task.status)
  const reviewTasks = group.tasks.filter((item) => isReviewTask(item.task.status))
  const detailTitleId = `work-inbox-detail-${group.worker.worker_id}`

  function handleOpenOtherCase() {
    const nextIndex = (Math.max(activeCaseIndex, 0) + 1) % group.cases.length
    setActiveCaseKey(group.cases[nextIndex].key)
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
            {group.worker.display_name}
          </h2>
          <p className={styles.detailMeta}>{getWorkerMeta(group)}</p>
        </div>
        <div className={styles.detailHeaderActions}>
          <button
            type="button"
            className={styles.moreButton}
            aria-label={`${group.worker.display_name} 업무 메뉴`}
            onClick={handleOpenWorkerMenu}
          >
            <span aria-hidden="true">···</span>
          </button>
        </div>
      </header>

      <nav className={styles.reviewStageNav} aria-label={`${group.worker.display_name} REVIEW-001 단계 바로가기`}>
        {REVIEW_STAGE_LINKS.map((stage) => (
          <Link
            key={stage.href}
            to={stage.href}
            className={`${styles.reviewStageLink} ${
              stage.href === reviewStage.href ? styles.reviewStageLinkActive : ''
            }`}
          >
            {stage.label}
          </Link>
        ))}
      </nav>

      <div className={styles.caseSummaryScroll}>
        <p className={styles.agentSuggestion}>
          Agent 제안 · {due.label}, {getWorkflowLabel(activeTask)} 확인 필요
        </p>

        <div className={styles.priorityCase}>
          <div className={styles.priorityCaseHeader}>
            <p className={styles.caseEyebrow}>
              우선 업무 건 · {Math.max(activeCaseIndex, 0) + 1}/{group.cases.length}
            </p>
            <button
              type="button"
              className={styles.textLink}
              onClick={() => onOpenTask(activeTask.task.task_id)}
            >
              <span>업무 건 열기</span>
              <span className={styles.linkChevron} aria-hidden="true">
                ›
              </span>
            </button>
          </div>
          <div className={styles.priorityCaseBody}>
            {activeCase.caseId && <span className={styles.srOnly}>Case {activeCase.caseId}</span>}
            <h3 className={styles.caseTitle}>{activeTask.task.title}</h3>
            <p className={styles.caseMeta}>
              {getWorkflowLabel(activeTask)} · {due.label} · {activeStatus.label}
            </p>
            <div className={styles.progressRow}>
              <span>
                {progress.completed}/{progress.total}
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
        </div>

        <section className={styles.detailSection} aria-labelledby="review-task-title">
          <div className={styles.sectionHeadingRow}>
            <h3 id="review-task-title" className={styles.sectionTitle}>
              검토할 업무
            </h3>
            <span className={styles.srOnly}>{reviewTasks.length}건</span>
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
            <p className={styles.decisionSummary}>{getDecisionSummary(activeTask.task.status)}</p>
            <p className={styles.decisionMeta}>
              진행 업무 건 {group.cases.length}개 · 확인할 업무 {reviewTasks.length}개 · 자동
              확정되지 않음
            </p>
          </div>
        </section>
      </div>
    </section>
  )
}
