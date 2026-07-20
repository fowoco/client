import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('defaults to the 현장관리자 role tab', () => {
    render(<LoginPage />)
    expect(screen.getByRole('tab', { name: '현장관리자' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('switches the active role tab on click', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.click(screen.getByRole('tab', { name: 'HR' }))

    expect(screen.getByRole('tab', { name: 'HR' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '현장관리자' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('disables the submit button until every field has a value', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const submit = screen.getByRole('button', { name: '로그인' })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText('사업장 코드'), 'FW-0001')
    await user.type(screen.getByLabelText('이메일'), 'hr@fowoco.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')

    expect(submit).toBeEnabled()
  })
})
