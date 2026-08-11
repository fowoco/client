import { useRef, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import statusLabelStyles from '../../components/ui/StatusLabel/StatusLabel.module.css'
import type { WorkInboxWorkerGroup } from './workInboxModel'
import { getDuePresentation, getReviewStageLink, getWorkflowLabel } from './workInboxPresentation'
import styles from './WorkListPage.module.css'

interface WorkInboxTargetListProps {
  groups: readonly WorkInboxWorkerGroup[]
  selectedWorkerId: string | null
  totalCount: number
  capNotice?: string | null
  onSelect: (workerId: string) => void
}

export function WorkInboxTargetList({
  groups,
  selectedWorkerId,
  totalCount,
  capNotice,
  onSelect,
}: WorkInboxTargetListProps) {
  const optionRefs = useRef(new Map<string, HTMLDivElement>())

  function moveSelection(event: KeyboardEvent<HTMLDivElement>, currentIndex: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(groups[currentIndex].workerId)
      return
    }

    let nextIndex: number
    if (event.key === 'ArrowDown') nextIndex = Math.min(currentIndex + 1, groups.length - 1)
    else if (event.key === 'ArrowUp') nextIndex = Math.max(currentIndex - 1, 0)
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = groups.length - 1
    else return

    event.preventDefault()
    const nextGroup = groups[nextIndex]
    if (!nextGroup) return
    onSelect(nextGroup.workerId)
    optionRefs.current.get(nextGroup.workerId)?.focus()
  }

  return (
    <section className={styles.listPanel} aria-labelledby="work-inbox-list-title">
      <div className={styles.listHeader}>
        <h2 id="work-inbox-list-title" className={styles.listTitle}>
          근로자 {totalCount}명
        </h2>
      </div>

      {capNotice && <p className={styles.capNotice}>{capNotice}</p>}

      <div className={styles.targetList} role="listbox" aria-label="업무 대상 근로자">
        {groups.map((group, index) => {
          const primaryCase = group.primaryCase
          const currentTask = primaryCase?.current_task ?? null
          const due = primaryCase
            ? getDuePresentation(currentTask?.due_date ?? primaryCase.due_date)
            : null
          const reviewStage = primaryCase
            ? getReviewStageLink(currentTask?.status ?? 'DRAFT')
            : null
          const selected = group.workerId === selectedWorkerId
          const hasActiveWork = group.activeCaseCount > 0

          return (
            <div
              key={group.workerId}
              ref={(node) => {
                if (node) optionRefs.current.set(group.workerId, node)
                else optionRefs.current.delete(group.workerId)
              }}
              role="option"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              className={`${styles.targetOption} ${selected ? styles.targetOptionSelected : ''}`}
              onClick={() => onSelect(group.workerId)}
              onKeyDown={(event) => moveSelection(event, index)}
            >
              <span className={styles.targetOptionTop}>
                <span className={styles.targetName}>{group.workerDisplayName}</span>
                {hasActiveWork && reviewStage ? (
                  <Link
                    to={reviewStage.href}
                    className={`${statusLabelStyles.label} ${statusLabelStyles[reviewStage.tone]}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {reviewStage.label}
                  </Link>
                ) : (
                  <span className={`${statusLabelStyles.label} ${statusLabelStyles.neutral}`}>
                    업무 없음
                  </span>
                )}
              </span>
              <span className={styles.targetMeta}>
                {hasActiveWork && primaryCase && due
                  ? `${currentTask ? getWorkflowLabel(currentTask) : primaryCase.title} · ${due.label}`
                  : group.historyCaseCount > 0
                    ? `완료·취소 이력 ${group.historyCaseCount}건`
                    : '새 업무를 요청할 수 있습니다'}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
