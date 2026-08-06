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

    let nextIndex = currentIndex
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
          const currentTask = group.primaryCase.current_task
          const due = getDuePresentation(currentTask?.due_date ?? group.primaryCase.due_date)
          const reviewStage = getReviewStageLink(currentTask?.status ?? 'DRAFT')
          const selected = group.workerId === selectedWorkerId

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
                <Link
                  to={reviewStage.href}
                  className={`${statusLabelStyles.label} ${statusLabelStyles[reviewStage.tone]}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  {reviewStage.label}
                </Link>
              </span>
              <span className={styles.targetMeta}>
                {currentTask ? getWorkflowLabel(currentTask) : group.primaryCase.title} · {due.label}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
