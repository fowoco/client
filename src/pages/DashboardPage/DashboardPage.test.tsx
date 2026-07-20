import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DashboardPage } from './DashboardPage'
import { DASHBOARD_STATS, TASK_BOARD_PREVIEW } from './dashboardData'

describe('DashboardPage', () => {
  it('renders every stat card with its count', () => {
    render(<DashboardPage />)

    for (const stat of DASHBOARD_STATS) {
      expect(screen.getByText(stat.label)).toBeInTheDocument()
    }
  })

  it('renders the task board preview cards', () => {
    render(<DashboardPage />)

    for (const task of TASK_BOARD_PREVIEW) {
      expect(screen.getByText(task.title)).toBeInTheDocument()
    }
  })

  it('renders the agent recommendation panel', () => {
    render(<DashboardPage />)

    expect(screen.getByText('FOWOCO Agent 추천')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '안내문 생성하기' })).toBeInTheDocument()
  })
})
