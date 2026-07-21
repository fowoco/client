import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DashboardPage } from './DashboardPage'
import { AGENT_SUMMARY, TODAY_WORK_ITEMS, UPCOMING_TIMELINE } from './dashboardData'

function renderPage(demoState = 'success') {
  render(
    <MemoryRouter initialEntries={[`/dashboard?demoState=${demoState}`]}>
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

  it('shows a loading state', () => {
    renderPage('loading')
    expect(screen.getByText('업무 현황을 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an empty state with a shortcut to create work', () => {
    renderPage('empty')
    expect(screen.getByText('오늘 처리할 업무가 없습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '업무 만들기' })).toBeInTheDocument()
  })

  it('shows an error state with a retry action', () => {
    renderPage('error')
    expect(screen.getByText('업무 현황을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })
})
