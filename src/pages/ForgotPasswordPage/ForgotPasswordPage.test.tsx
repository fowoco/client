import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ForgotPasswordPage } from './ForgotPasswordPage'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 202,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function errorResponse(status: number, code: string, message: string) {
  return jsonResponse(
    { timestamp: '2026-08-07T00:00:00Z', status, code, message, path: '/api/v1/auth/password-reset-requests', request_id: 'req-1', field_errors: [] },
    { status },
  )
}

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

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

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

  it('requests a reset link and navigates to /email-sent on valid submit', async () => {
    const user = userEvent.setup()
    let requestBody: string | undefined
    vi.mocked(fetch).mockImplementation((_input, init) => {
      requestBody = init?.body as string | undefined
      return Promise.resolve(new Response(null, { status: 202 }))
    })
    renderPage()

    await user.type(screen.getByLabelText('이메일'), 'mini@naver.com')
    await user.click(screen.getByRole('button', { name: '재설정 메일 보내기' }))

    expect(await screen.findByText('email sent screen')).toBeInTheDocument()
    expect(JSON.parse(requestBody!)).toEqual({ email: 'mini@naver.com' })
  })

  it('shows an error message when the request fails', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValue(errorResponse(500, 'INTERNAL_SERVER_ERROR', 'raw'))
    renderPage()

    await user.type(screen.getByLabelText('이메일'), 'mini@naver.com')
    await user.click(screen.getByRole('button', { name: '재설정 메일 보내기' }))

    expect(await screen.findByText('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')).toBeInTheDocument()
    expect(screen.queryByText('email sent screen')).not.toBeInTheDocument()
  })
})
