import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SignupPage } from './SignupPage'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors: { field: string; message: string }[] = [],
) {
  return jsonResponse(
    {
      timestamp: '2026-07-27T01:23:45Z',
      status,
      code,
      message,
      path: '/api/v1/auth/signup',
      request_id: 'req-1',
      field_errors: fieldErrors,
    },
    { status },
  )
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<p>login screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('이름'), '김경민')
  await user.type(screen.getByLabelText('업무용 이메일'), 'mini@naver.com')
  await user.type(screen.getByLabelText('회사명'), '한빛정밀')
  await user.type(screen.getByLabelText('비밀번호'), 'password123')
  await user.type(screen.getByLabelText('비밀번호 확인'), 'password123')
  await user.click(screen.getByLabelText('[필수] 서비스 이용약관 동의'))
  await user.click(screen.getByLabelText('[필수] 개인정보 수집 및 이용 동의'))
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SignupPage', () => {
  it('blocks submit and does not call the API when required terms are not agreed', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('이름'), '김경민')
    await user.type(screen.getByLabelText('업무용 이메일'), 'mini@naver.com')
    await user.type(screen.getByLabelText('회사명'), '한빛정밀')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'password123')
    await user.click(screen.getByRole('button', { name: '계정 만들기' }))

    expect(screen.getByText('필수 약관에 동의해 주세요.')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('shows a password strength meter once typing starts', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByText(/비밀번호 강도/)).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('비밀번호'), 'password123')

    expect(screen.getByText(/비밀번호 강도/)).toBeInTheDocument()
  })

  it('calls the signup API with the mapped request body and navigates on success', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        {
          user_id: 'u-1',
          company_id: 'c-1',
          company_name: '한빛정밀',
          display_name: '김경민',
          email: 'mini@naver.com',
          role: 'ADMIN',
          created_at: '2026-07-27T01:00:00Z',
        },
        { status: 201 },
      ),
    )
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: '계정 만들기' }))

    expect(await screen.findByText('login screen')).toBeInTheDocument()
    const [, requestInit] = vi.mocked(fetch).mock.calls[0]
    expect(JSON.parse((requestInit as RequestInit).body as string)).toEqual({
      company_name: '한빛정밀',
      display_name: '김경민',
      email: 'mini@naver.com',
      password: 'password123',
      agreements: {
        service_terms: { agreed: true, version: '1.0' },
        privacy_policy: { agreed: true, version: '1.0' },
        marketing: { agreed: false, version: '1.0' },
      },
    })
  })

  it('shows an inline email error when the email is already registered', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(
      errorResponse(409, 'EMAIL_ALREADY_REGISTERED', 'raw'),
    )
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: '계정 만들기' }))

    expect(await screen.findByText('이미 가입된 이메일입니다.')).toBeInTheDocument()
  })

  it('maps server field errors to the matching screen fields', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(
      errorResponse(400, 'VALIDATION_FAILED', 'raw', [
        { field: 'company_name', message: '사업장명 형식이 올바르지 않습니다.' },
      ]),
    )
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: '계정 만들기' }))

    expect(await screen.findByText('사업장명 형식이 올바르지 않습니다.')).toBeInTheDocument()
  })
})
