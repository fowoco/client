import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { EmailSentPage } from './EmailSentPage'

function renderPage(email?: string) {
  render(
    <MemoryRouter
      initialEntries={[{ pathname: '/email-sent', state: email ? { email } : null }]}
    >
      <Routes>
        <Route
          path="/email-sent"
          element={
            <>
              <EmailSentPage />
              <ToastViewport />
            </>
          }
        />
        <Route path="/login" element={<p>login screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('EmailSentPage', () => {
  it('shows the email passed via router state', () => {
    renderPage('mini@naver.com')
    expect(
      screen.getByText('mini@naver.com으로 비밀번호 재설정 안내를 보냈습니다.'),
    ).toBeInTheDocument()
  })

  it('falls back to a placeholder email when no state is passed', () => {
    renderPage()
    expect(
      screen.getByText('name@company.com으로 비밀번호 재설정 안내를 보냈습니다.'),
    ).toBeInTheDocument()
  })

  it('disables resend during the 30s cooldown', () => {
    renderPage('mini@naver.com')
    expect(screen.getByRole('button', { name: '메일 다시 보내기' })).toBeDisabled()
    expect(screen.getByText('30초 후 다시 보낼 수 있습니다.')).toBeInTheDocument()
  })

  it('shows a toast when "이메일 열기" is clicked (demo has no real mail client)', async () => {
    const user = userEvent.setup()
    renderPage('mini@naver.com')

    await user.click(screen.getByRole('button', { name: '이메일 열기' }))

    expect(
      await screen.findByText('데모에서는 실제 이메일 앱을 열 수 없습니다.'),
    ).toBeInTheDocument()
  })
})
