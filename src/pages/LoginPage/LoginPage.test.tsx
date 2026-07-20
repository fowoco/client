import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('renders the product promise and agent trace', () => {
    render(<LoginPage />)
    expect(screen.getByText('업무를 시작하세요')).toBeInTheDocument()
    expect(screen.getByText('03 HR 검토와 승인')).toBeInTheDocument()
  })

  it('disables the submit button until email and password have a value', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const submit = screen.getByRole('button', { name: '로그인' })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText('이메일'), 'hr@fowoco.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')

    expect(submit).toBeEnabled()
  })
})
