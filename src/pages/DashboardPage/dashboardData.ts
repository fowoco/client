import type { TaskSummaryResponse } from '../../api/tasks'
import type { WorkItemUrgency } from '../../components/ui/WorkItemRow/WorkItemRow'
import { TASK_STATUS_LABEL, TASK_STATUS_NEXT_ACTION } from '../../utils/taskStatus'
import { daysUntil } from '../../utils/urgency'
import { EXAMPLE_PROMPTS } from '../CreateWorkPage/createWorkData'

export const AI_REQUEST_PROMPT_CHIPS = EXAMPLE_PROMPTS

export interface DashboardMetric {
  id: string
  label: string
  value: number
}

export interface DashboardWorkItem {
  id: string
  title: string
  meta: string
  nextAction: string
  urgency: WorkItemUrgency
}

function isOpenTask(task: TaskSummaryResponse) {
  return task.status !== 'COMPLETED' && task.status !== 'CANCELLED'
}

function isSameLocalDate(dateTime: string, target: Date) {
  const value = new Date(dateTime)
  return (
    value.getFullYear() === target.getFullYear() &&
    value.getMonth() === target.getMonth() &&
    value.getDate() === target.getDate()
  )
}

function dueLabel(dueDate: string | null) {
  const days = daysUntil(dueDate)
  if (days === null) return '기한 없음'
  if (days < 0) return `${Math.abs(days)}일 지남`
  if (days === 0) return '오늘'
  return `D-${days}`
}

function urgency(dueDate: string | null): WorkItemUrgency {
  const days = daysUntil(dueDate)
  if (days !== null && days <= 0) return 'critical'
  if (days !== null && days <= 7) return 'warning'
  return 'neutral'
}

export function buildDashboardMetrics(tasks: TaskSummaryResponse[], now = new Date()): DashboardMetric[] {
  const openTasks = tasks.filter(isOpenTask)
  return [
    { id: 'ready-for-review', label: '검토 필요', value: openTasks.filter((task) => task.status === 'READY_FOR_REVIEW').length },
    { id: 'remaining-work', label: '남은 업무', value: openTasks.length },
    {
      id: 'due-risk',
      label: '기한 위험',
      value: openTasks.filter((task) => {
        const days = daysUntil(task.due_date)
        return days !== null && days <= 7
      }).length,
    },
    {
      id: 'done-today',
      label: '오늘 완료',
      value: tasks.filter((task) => task.status === 'COMPLETED' && isSameLocalDate(task.updated_at, now)).length,
    },
  ]
}

export function buildDashboardWorkItems(tasks: TaskSummaryResponse[]): DashboardWorkItem[] {
  return tasks
    .filter(isOpenTask)
    .sort((a, b) => {
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date.localeCompare(b.due_date)
    })
    .slice(0, 5)
    .map((task) => ({
      id: task.task_id,
      title: task.title,
      meta: `${dueLabel(task.due_date)} · ${TASK_STATUS_LABEL[task.status]}`,
      nextAction: TASK_STATUS_NEXT_ACTION[task.status],
      urgency: urgency(task.due_date),
    }))
}

export function buildUpcomingTimeline(tasks: TaskSummaryResponse[]) {
  return tasks
    .filter(isOpenTask)
    .map((task) => ({ task, days: daysUntil(task.due_date) }))
    .filter(({ days }) => days !== null && days >= 0 && days <= 7)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
    .slice(0, 3)
    .map(({ task }) => `${dueLabel(task.due_date)} · ${task.title}`)
}
