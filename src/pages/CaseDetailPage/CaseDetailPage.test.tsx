import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CaseDetailPage } from './CaseDetailPage'
import { CASE_HEADER, CASE_STEPS, CASE_TABS } from './caseDetailData'

function renderPage() {
  render(
    <MemoryRouter>
      <CaseDetailPage />
    </MemoryRouter>,
  )
}

describe('CaseDetailPage', () => {
  it('renders the case title and every step', () => {
    renderPage()
    expect(screen.getByText(CASE_HEADER.title)).toBeInTheDocument()
    for (const step of CASE_STEPS) {
      expect(screen.getByText(step.title)).toBeInTheDocument()
    }
  })

  it('switches the active tab on click', async () => {
    const user = userEvent.setup()
    renderPage()

    const checklistTab = screen.getByRole('tab', { name: CASE_TABS[1] })
    await user.click(checklistTab)

    expect(checklistTab).toHaveAttribute('aria-selected', 'true')
  })

  it('renders the blocked completion banner', () => {
    renderPage()
    expect(screen.getByText('완료 처리 불가 · 승인과 증빙 필요')).toBeInTheDocument()
  })
})
