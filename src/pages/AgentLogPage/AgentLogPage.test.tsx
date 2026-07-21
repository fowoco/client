import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AgentLogPage } from './AgentLogPage'
import { AGENT_LOGS } from './agentLogData'

function renderPage(demoState = 'success') {
  render(
    <MemoryRouter initialEntries={[`/agent?demoState=${demoState}`]}>
      <Routes>
        <Route path="/agent" element={<AgentLogPage />} />
        <Route path="/tasks/:caseId" element={<p>업무 상세</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AgentLogPage', () => {
  it('renders every agent log row', () => {
    renderPage()

    for (const log of AGENT_LOGS) {
      expect(screen.getByText(log.description)).toBeInTheDocument()
    }
  })

  it('filters logs by source', async () => {
    const user = userEvent.setup()
    renderPage()

    const trigger = screen.getByRole('button', { name: '근거 출처 필터' })
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: '근거 · Agent 초안' }))

    expect(screen.getByText(AGENT_LOGS[0].description)).toBeInTheDocument()
    expect(screen.queryByText(AGENT_LOGS[1].description)).not.toBeInTheDocument()
  })

  it('filters logs by period', async () => {
    const user = userEvent.setup()
    renderPage()

    const trigger = screen.getByRole('button', { name: '기간 필터' })
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: '기간 · 오늘' }))

    expect(screen.getByText(AGENT_LOGS[0].description)).toBeInTheDocument()
    expect(screen.queryByText(AGENT_LOGS[4].description)).not.toBeInTheDocument()
  })

  it('navigates to the related work item on click', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getAllByRole('button', { name: '관련 업무 보기 →' })[0])

    expect(screen.getByText('업무 상세')).toBeInTheDocument()
  })

  it('shows a loading state', () => {
    renderPage('loading')
    expect(screen.getByText('Agent 이력을 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an error state', () => {
    renderPage('error')
    expect(screen.getByText('Agent 이력을 불러오지 못했습니다')).toBeInTheDocument()
  })
})
