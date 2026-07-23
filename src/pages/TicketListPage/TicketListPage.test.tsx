import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { TicketListPage } from './TicketListPage'
import { TICKET_TABS, TICKETS } from './ticketListData'

function renderPage(demoState = 'success') {
  render(
    <MemoryRouter initialEntries={[`/tickets?demoState=${demoState}`]}>
      <Routes>
        <Route path="/tickets" element={<TicketListPage />} />
        <Route path="/tickets/:ticketId" element={<p>티켓 상세</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TicketListPage', () => {
  it('renders every tab and defaults to the 신규 tab tickets', () => {
    renderPage()

    for (const tab of TICKET_TABS) {
      expect(screen.getByRole('tab', { name: `${tab.label} ${tab.count}` })).toBeInTheDocument()
    }
    const newTickets = TICKETS.filter((ticket) => ticket.status === 'new')
    for (const ticket of newTickets) {
      expect(screen.getByText(ticket.summary)).toBeInTheDocument()
    }
  })

  it('switches tickets when a different tab is selected', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: '완료 6' }))

    const doneTicket = TICKETS.find((ticket) => ticket.status === 'done')
    expect(screen.getByText(doneTicket!.summary)).toBeInTheDocument()
    expect(screen.queryByText(TICKETS[0].summary)).not.toBeInTheDocument()
  })

  it('navigates to the ticket detail when "답변하기 →" is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getAllByRole('button', { name: '답변하기 →' })[0])

    expect(await screen.findByText('티켓 상세')).toBeInTheDocument()
  })

  it('shows a loading state', () => {
    renderPage('loading')
    expect(screen.getByText('티켓 목록을 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an error state', () => {
    renderPage('error')
    expect(screen.getByText('티켓 목록을 불러오지 못했습니다')).toBeInTheDocument()
  })
})
