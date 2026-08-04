import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DashboardPage } from './DashboardPage'
import {
  AGENT_PREPARED,
  AI_REQUEST_PROMPT_CHIPS,
  METRIC_STRIP,
  TODAY_WORK_ITEMS,
  TOP_APPROVAL,
} from './dashboardData'

function renderPage(demoState = 'success') {
  render(
    <MemoryRouter initialEntries={[`/dashboard?demoState=${demoState}`]}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks/new" element={<p>업무 생성 페이지</p>} />
        <Route path="/tasks" element={<p>업무함</p>} />
        <Route path="/tasks/:taskId" element={<p>업무 상세</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  it('renders the pending-approval headline', () => {
    renderPage()
    const pendingApproval = METRIC_STRIP.find((metric) => metric.id === 'pending-approval')
    expect(
      screen.getByText(`지금 확인이 필요한 승인 ${pendingApproval?.value}건이 있습니다.`),
    ).toBeInTheDocument()
  })

  it('renders the top approval card and navigates to its task on click', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByText(TOP_APPROVAL.title)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: TOP_APPROVAL.actionLabel }))

    expect(await screen.findByText('업무 상세')).toBeInTheDocument()
  })

  it('renders every work item row', () => {
    renderPage()
    for (const item of TODAY_WORK_ITEMS) {
      expect(screen.getByText(item.title)).toBeInTheDocument()
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

  it('renders the agent-prepared panel with ready, needs-info, and after-approval groups', () => {
    renderPage()
    for (const item of AGENT_PREPARED.ready) {
      expect(screen.getByText(item.label, { exact: false })).toBeInTheDocument()
    }
    for (const item of AGENT_PREPARED.needsInfo) {
      expect(screen.getByText(item.label, { exact: false })).toBeInTheDocument()
    }
    for (const item of AGENT_PREPARED.afterApproval) {
      expect(screen.getByText(item.label, { exact: false })).toBeInTheDocument()
    }
  })

  it('navigates to work creation when the command box is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText(/처리할 업무를 자연어로 입력해 주세요/))

    expect(await screen.findByText('업무 생성 페이지')).toBeInTheDocument()
  })

  it('navigates to work creation with the chosen prompt chip prefilled', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: AI_REQUEST_PROMPT_CHIPS[0] }))

    expect(await screen.findByText('업무 생성 페이지')).toBeInTheDocument()
  })
})
