import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DashboardPage } from './DashboardPage'
import { AGENT_SUMMARY, TODAY_WORK_ITEMS, UPCOMING_TIMELINE } from './dashboardData'

describe('DashboardPage', () => {
  it('renders the agent summary', () => {
    render(<DashboardPage />)
    expect(screen.getByText(AGENT_SUMMARY.headline)).toBeInTheDocument()
  })

  it('renders every work item row', () => {
    render(<DashboardPage />)
    for (const item of TODAY_WORK_ITEMS) {
      expect(screen.getByText(item.title)).toBeInTheDocument()
    }
  })

  it('renders the upcoming timeline', () => {
    render(<DashboardPage />)
    for (const item of UPCOMING_TIMELINE) {
      expect(screen.getByText(item)).toBeInTheDocument()
    }
  })
})
