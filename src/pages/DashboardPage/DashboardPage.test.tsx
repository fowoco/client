import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DashboardPage } from './DashboardPage'
import styles from './DashboardPage.module.css'
import {
  AGENT_PREPARED,
  AI_REQUEST_PROMPT_CHIPS,
  APPROVAL_QUEUE,
  METRIC_STRIP,
  TODAY_WORK_ITEMS,
} from './dashboardData'

function renderPage(demoState = 'success') {
  return render(
    <MemoryRouter initialEntries={[`/dashboard?demoState=${demoState}`]}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks/new" element={<p>업무 생성 페이지</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  it('renders the blocking approval headline from the HOME-001 structure', () => {
    renderPage()
    expect(
      screen.getByRole('heading', {
        name: `지금 확인이 필요한 승인 ${APPROVAL_QUEUE.blockingCount}건이 있습니다.`,
      }),
    ).toBeInTheDocument()
  })

  it('renders every work item row', () => {
    renderPage()
    for (const item of TODAY_WORK_ITEMS) {
      expect(screen.getByText(item.title)).toBeInTheDocument()
    }
  })

  it('renders the Figma status label and next action for every priority work item', () => {
    renderPage()
    for (const item of TODAY_WORK_ITEMS) {
      expect(screen.getByText(item.status)).toBeInTheDocument()
      expect(screen.getAllByText(item.nextAction).length).toBeGreaterThan(0)
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

  it('renders every Agent prepared group', () => {
    renderPage()
    const items = [
      ...AGENT_PREPARED.prepared,
      ...AGENT_PREPARED.review,
      ...AGENT_PREPARED.afterApproval,
    ]
    for (const item of items) {
      expect(screen.getByText(item.label)).toBeInTheDocument()
    }
  })

  it('uses the Figma desktop grid class for the success view', () => {
    const { container } = renderPage()
    expect(container.querySelector(`.${styles.dashboardGrid}`)).toBeInTheDocument()
  })

  it('navigates to work creation with the chosen prompt chip prefilled', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: AI_REQUEST_PROMPT_CHIPS[0] }))

    expect(await screen.findByText('업무 생성 페이지')).toBeInTheDocument()
  })
})
