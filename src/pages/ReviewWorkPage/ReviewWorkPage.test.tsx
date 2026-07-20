import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ReviewWorkPage } from './ReviewWorkPage'
import { MISSING_INFO, PREPARED_DRAFT, UNDERSTOOD_REQUEST } from './reviewWorkData'

function renderPage() {
  render(
    <MemoryRouter>
      <ReviewWorkPage />
    </MemoryRouter>,
  )
}

describe('ReviewWorkPage', () => {
  it('renders the understood request and prepared draft', () => {
    renderPage()
    expect(screen.getByText(UNDERSTOOD_REQUEST.purpose)).toBeInTheDocument()
    expect(screen.getByText(PREPARED_DRAFT.rows[0].value)).toBeInTheDocument()
  })

  it('disables create button until the missing institution is selected', async () => {
    const user = userEvent.setup()
    renderPage()

    const create = screen.getByRole('button', { name: '정보 확인 후 업무 생성' })
    expect(create).toBeDisabled()

    await user.selectOptions(
      screen.getByLabelText(MISSING_INFO.placeholder),
      MISSING_INFO.options[0],
    )

    expect(create).toBeEnabled()
  })
})
