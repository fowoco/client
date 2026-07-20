import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { LoginPage } from './LoginPage'
import { DEMO_ACCOUNT, useAuthStore } from '../../store/authStore'

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<p>dashboard screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('renders the product promise and agent trace', () => {
    renderPage()
    expect(screen.getByText('업무를 시작하세요')).toBeInTheDocument()
    expect(screen.getByText('03 HR 검토와 승인')).toBeInTheDocument()
  })

  it('disables the submit button until email and password have a value', async () => {
    const user = userEvent.setup()
    renderPage()

    const submit = screen.getByRole('button', { name: '로그인' })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText('이메일'), 'hr@fowoco.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')

    expect(submit).toBeEnabled()
  })

  it('shows an error for incorrect demo credentials', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('이메일'), 'wrong@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(
      screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다.'),
    ).toBeInTheDocument()
  })

  it('navigates to the dashboard on successful demo login', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('이메일'), DEMO_ACCOUNT.email)
    await user.type(screen.getByLabelText('비밀번호'), DEMO_ACCOUNT.password)
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(screen.getByText('dashboard screen')).toBeInTheDocument()
  })
})
