import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'
import { DEMO_ACCOUNT, useAuthStore } from '../../store/authStore'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function errorResponse(status: number, code: string, message: string) {
  return jsonResponse(
    {
      timestamp: '2026-07-22T01:23:45Z',
      status,
      code,
      message,
      path: '/api/v1/auth/login',
      request_id: 'req-1',
      field_errors: [],
    },
    { status },
  )
}

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

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }))
  await useAuthStore.getState().logout()
  vi.unstubAllGlobals()
})

describe('LoginPage', () => {
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

  it('shows the server-provided error message for incorrect credentials', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(401, 'INVALID_CREDENTIALS', 'raw'))
    renderPage()

    await user.type(screen.getByLabelText('이메일'), 'wrong@example.com')
    await user.type(screen.getByLabelText('비밀번호'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(
      await screen.findByText('이메일 또는 비밀번호가 올바르지 않습니다.'),
    ).toBeInTheDocument()
  })

  it('navigates to the dashboard on successful login', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        user_id: 'u-1',
        company_id: 'c-1',
        company_name: '한빛정밀',
        role: 'HR',
        access_token: 'access-1',
        token_type: 'Bearer',
        expires_in_seconds: 900,
        expires_at: '2026-07-22T01:15:00Z',
      }),
    )
    renderPage()

    await user.type(screen.getByLabelText('이메일'), DEMO_ACCOUNT.email)
    await user.type(screen.getByLabelText('비밀번호'), DEMO_ACCOUNT.password)
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('dashboard screen')).toBeInTheDocument()
  })
})
