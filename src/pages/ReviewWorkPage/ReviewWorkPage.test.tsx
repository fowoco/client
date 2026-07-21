import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { ReviewWorkPage } from './ReviewWorkPage'
import { MISSING_INFO, PREPARED_DRAFT, UNDERSTOOD_REQUEST } from './reviewWorkData'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

function renderPage() {
  render(
    <MemoryRouter>
      <ReviewWorkPage />
      <ToastViewport />
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

    await user.click(screen.getByRole('button', { name: MISSING_INFO.placeholder }))
    await user.click(screen.getByRole('option', { name: MISSING_INFO.options[0] }))

    expect(create).toBeEnabled()
  })

  it('shows a toast when a draft is saved', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '초안 저장' }))

    expect(screen.getByText('초안을 저장했습니다.')).toBeInTheDocument()
  })
})
