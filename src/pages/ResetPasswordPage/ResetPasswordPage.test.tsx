import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ResetPasswordPage } from './ResetPasswordPage'

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/reset-password']}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-complete" element={<p>reset complete screen</p>} />
        <Route path="/forgot-password" element={<p>forgot password screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResetPasswordPage', () => {
  it('shows a password strength meter once typing starts', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByText(/비밀번호 강도/)).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('새 비밀번호'), 'password123')

    expect(screen.getByText(/비밀번호 강도/)).toBeInTheDocument()
  })

  it('shows an error when the confirmation does not match', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('새 비밀번호'), 'password123')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'different123')
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }))

    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument()
  })

  it('navigates to /reset-complete on a valid submit', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('새 비밀번호'), 'password123')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'password123')
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }))

    expect(await screen.findByText('reset complete screen')).toBeInTheDocument()
  })

  it('links the expired-link recovery note back to /forgot-password', () => {
    renderPage()
    expect(screen.getByRole('link', { name: '재설정 링크 다시 받기' })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
  })
})
