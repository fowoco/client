import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DashboardPage } from './DashboardPage'
import { AGENT_SUMMARY, TODAY_WORK_ITEMS, UPCOMING_TIMELINE } from './dashboardData'

function renderPage() {
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  it('renders the agent summary', () => {
    renderPage()
    expect(screen.getByText(AGENT_SUMMARY.headline)).toBeInTheDocument()
  })

  it('renders every work item row', () => {
    renderPage()
    for (const item of TODAY_WORK_ITEMS) {
      expect(screen.getByText(item.title)).toBeInTheDocument()
    }
  })

  it('renders the upcoming timeline', () => {
    renderPage()
    for (const item of UPCOMING_TIMELINE) {
      expect(screen.getByText(item)).toBeInTheDocument()
    }
  })
})
