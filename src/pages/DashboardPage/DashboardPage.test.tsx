import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DashboardPage } from './DashboardPage'
import styles from './DashboardPage.module.css'
import {
  AGENT_SUMMARY,
  AI_PREPARED_CHECKLIST,
  AI_REQUEST_PROMPT_CHIPS,
  APPROVAL_QUEUE,
  METRIC_STRIP,
  TODAY_WORK_ITEMS,
  UPCOMING_TIMELINE,
} from './dashboardData'

function renderPage(demoState = 'success') {
  render(
    <MemoryRouter initialEntries={[`/dashboard?demoState=${demoState}`]}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks/new" element={<p>업무 생성 페이지</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  it('renders the agent summary', () => {
    renderPage()
    expect(screen.getByText(AGENT_SUMMARY.headline)).toBeInTheDocument()
  })

  it('colors the approval count as warning while there are pending approvals', () => {
    renderPage()
    expect(APPROVAL_QUEUE.count).toBeGreaterThan(0)
    expect(screen.getByText(`${APPROVAL_QUEUE.count}건`)).not.toHaveClass(styles.approvalCountClear)
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

  it('renders every metric strip card', () => {
    renderPage()
    for (const metric of METRIC_STRIP) {
      expect(screen.getByText(`${metric.value}건 ›`)).toBeInTheDocument()
    }
  })

  it('renders the AI prepared checklist', () => {
    renderPage()
    for (const item of AI_PREPARED_CHECKLIST) {
      expect(screen.getByText(item.label)).toBeInTheDocument()
    }
  })

  it('navigates to work creation with the chosen prompt chip prefilled', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: AI_REQUEST_PROMPT_CHIPS[0] }))

    expect(await screen.findByText('업무 생성 페이지')).toBeInTheDocument()
  })
})
