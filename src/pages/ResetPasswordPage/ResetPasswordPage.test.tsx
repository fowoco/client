import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ResetPasswordPage } from './ResetPasswordPage'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 204,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function errorResponse(status: number, code: string, message: string) {
  return jsonResponse(
    { timestamp: '2026-08-07T00:00:00Z', status, code, message, path: '/api/v1/auth/password-resets', request_id: 'req-1', field_errors: [] },
    { status },
  )
}

function renderPage(initialPath = '/reset-password?token=valid-token') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-complete" element={<p>reset complete screen</p>} />
        <Route path="/forgot-password" element={<p>forgot password screen</p>} />
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

  it('submits the token from the URL and navigates to /reset-complete on success', async () => {
    const user = userEvent.setup()
    let requestBody: string | undefined
    vi.mocked(fetch).mockImplementation((_input, init) => {
      requestBody = init?.body as string | undefined
      return Promise.resolve(new Response(null, { status: 204 }))
    })
    renderPage()

    await user.type(screen.getByLabelText('새 비밀번호'), 'password123')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'password123')
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }))

    expect(await screen.findByText('reset complete screen')).toBeInTheDocument()
    expect(JSON.parse(requestBody!)).toEqual({ token: 'valid-token', new_password: 'password123' })
  })

  it('shows an error and does not navigate when the token is missing from the URL', async () => {
    const user = userEvent.setup()
    renderPage('/reset-password')

    await user.type(screen.getByLabelText('새 비밀번호'), 'password123')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'password123')
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }))

    expect(screen.getByText('재설정 링크가 올바르지 않습니다. 새 링크를 요청해 주세요.')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('shows the server error when the token is invalid or expired', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValue(
      errorResponse(400, 'INVALID_PASSWORD_RESET_TOKEN', '재설정 링크가 만료되었습니다.'),
    )
    renderPage()

    await user.type(screen.getByLabelText('새 비밀번호'), 'password123')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'password123')
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }))

    expect(await screen.findByText('재설정 링크가 만료되었습니다.')).toBeInTheDocument()
  })

  it('links the expired-link recovery note back to /forgot-password', () => {
    renderPage()
    expect(screen.getByRole('link', { name: '재설정 링크 다시 받기' })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
  })
})
