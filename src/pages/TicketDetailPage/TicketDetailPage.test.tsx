import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { TicketDetailPage } from './TicketDetailPage'
import { TICKETS } from '../TicketListPage/ticketListData'

function renderPage(ticketId: string) {
  render(
    <MemoryRouter initialEntries={[`/tickets/${ticketId}`]}>
      <Routes>
        <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
        <Route path="/tickets" element={<p>티켓 목록</p>} />
        <Route path="/tasks/:caseId" element={<p>업무 상세</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TicketDetailPage', () => {
  it('renders the question and worker name for the selected ticket', () => {
    const ticket = TICKETS[0]
    renderPage(ticket.id)

    expect(screen.getByRole('heading', { name: ticket.workerName })).toBeInTheDocument()
    expect(screen.getByText(ticket.question)).toBeInTheDocument()
  })

  it('navigates to the related task when one exists', async () => {
    const user = userEvent.setup()
    const ticket = TICKETS.find((item) => item.relatedCaseId !== null)!
    renderPage(ticket.id)

    await user.click(screen.getByRole('button', { name: `${ticket.relatedCaseId} 업무 상세 열기 →` }))

    expect(await screen.findByText('업무 상세')).toBeInTheDocument()
  })

  it('shows an empty state when there is no related task', () => {
    const ticket = TICKETS.find((item) => item.relatedCaseId === null)!
    renderPage(ticket.id)

    expect(screen.getByText('연결된 업무가 없습니다')).toBeInTheDocument()
  })

  it('sends an answer and advances a 신규 ticket to 응답 대기', async () => {
    const user = userEvent.setup()
    const ticket = TICKETS.find((item) => item.status === 'new')!
    renderPage(ticket.id)

    await user.type(screen.getByPlaceholderText('근로자에게 보낼 답변을 입력하세요'), '확인 후 안내드리겠습니다.')
    await user.click(screen.getByRole('button', { name: '답변 발송' }))

    expect(screen.getByText('확인 후 안내드리겠습니다.')).toBeInTheDocument()
    expect(screen.getByText('응답 대기')).toBeInTheDocument()
  })

  it('advances status via the status action button', async () => {
    const user = userEvent.setup()
    const ticket = TICKETS.find((item) => item.status === 'waiting')!
    renderPage(ticket.id)

    await user.click(screen.getByRole('button', { name: '완료 처리' }))

    expect(screen.getByText('현재 상태: 완료')).toBeInTheDocument()
  })

  it('falls back to the first ticket when the ticketId is invalid', () => {
    renderPage('does-not-exist')

    expect(screen.getByRole('heading', { name: TICKETS[0].workerName })).toBeInTheDocument()
  })
})
