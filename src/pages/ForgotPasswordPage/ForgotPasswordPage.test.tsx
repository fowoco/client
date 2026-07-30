import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ForgotPasswordPage } from './ForgotPasswordPage'

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/email-sent" element={<p>email sent screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ForgotPasswordPage', () => {
  it('renders the recovery form', () => {
    renderPage()
    expect(screen.getByText('비밀번호를 잊으셨나요?')).toBeInTheDocument()
  })

  it('shows a validation error for an invalid email and does not navigate', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('이메일'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: '재설정 메일 보내기' }))

    expect(screen.getByText('이메일 형식을 확인해 주세요.')).toBeInTheDocument()
    expect(screen.queryByText('email sent screen')).not.toBeInTheDocument()
  })

  it('navigates to /email-sent with the entered email on valid submit', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('이메일'), 'mini@naver.com')
    await user.click(screen.getByRole('button', { name: '재설정 메일 보내기' }))

    expect(await screen.findByText('email sent screen')).toBeInTheDocument()
  })
})
