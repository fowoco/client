import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SignupPage } from './SignupPage'

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<p>login screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SignupPage', () => {
  it('shows field errors when submitted empty', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '회원가입' }))

    expect(screen.getByText('사업장명을 입력해 주세요.')).toBeInTheDocument()
    expect(screen.getByText('이름을 입력해 주세요.')).toBeInTheDocument()
  })

  it('shows an error when passwords do not match', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('사업장명'), '한빛정밀')
    await user.type(screen.getByLabelText('이름'), '김경민')
    await user.type(screen.getByLabelText('이메일'), 'mini@naver.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'different123')
    await user.click(screen.getByRole('button', { name: '회원가입' }))

    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument()
  })

  it('navigates to login with success flag on valid submission', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('사업장명'), '한빛정밀')
    await user.type(screen.getByLabelText('이름'), '김경민')
    await user.type(screen.getByLabelText('이메일'), 'mini@naver.com')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'password123')
    await user.click(screen.getByRole('button', { name: '회원가입' }))

    expect(screen.getByText('login screen')).toBeInTheDocument()
  })
})
