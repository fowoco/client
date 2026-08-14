import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../../store/authStore'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { ProfilePage } from './ProfilePage'

// fowoco/server ProfileResponse (GET/PATCH /api/v1/auth/me/profile) 그대로.
const PROFILE = { display_name: '김민지 HR', phone: '010-0000-1234' }

const SETTINGS = {
  approval_policy: 'ADMIN_OR_HR',
  link_expiry_hours: 72,
  evidence_rules: { RECONTRACT: ['DOCUMENT'] },
  file_retention_days: 365,
  ai_log_retention_days: 90,
  audit_visibility: 'ADMIN_ONLY',
  version: 3,
}

const MEMBERS = { items: [] }

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderPage() {
  const router = createMemoryRouter(
    [
      {
        path: '/profile',
        element: (
          <>
            <ProfilePage />
            <ToastViewport />
          </>
        ),
      },
      { path: '/dashboard', element: <p>대시보드 페이지</p> },
      { path: '/reset-password', element: <p>비밀번호 재설정 페이지</p> },
    ],
    { initialEntries: ['/profile'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/company-members')) return jsonResponse(MEMBERS)
      if (url.includes('/settings')) return jsonResponse(SETTINGS)
      if (url.includes('/auth/me/profile') && init?.method === 'PATCH') {
        return jsonResponse({ ...PROFILE, ...JSON.parse(init.body as string) })
      }
      if (url.includes('/auth/me/profile')) return jsonResponse(PROFILE)
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    }),
  )
})

afterEach(() => {
  useAuthStore.setState({ user: null })
  vi.unstubAllGlobals()
})

describe('ProfilePage', () => {
  it('renders the profile summary and editable fields fetched from the API', async () => {
    renderPage()

    expect(screen.getByRole('heading', { name: '설정' })).toBeInTheDocument()
    expect((await screen.findAllByText('김민지 HR')).length).toBeGreaterThan(0)
    expect(screen.getByText('010-0000-1234')).toBeInTheDocument()
  })

  it("shows the real logged-in user's identity instead of the fixture persona", async () => {
    useAuthStore.setState({
      user: {
        name: 'demo.admin',
        phone: null,
        email: 'demo.admin@example.com',
        workplace: 'FOWOCO Demo Company',
        role: 'ADMIN',
      },
      status: 'ready',
    })
    renderPage()

    await waitFor(() => expect(screen.getAllByText('demo.admin').length).toBeGreaterThan(0))
    expect(screen.getAllByText(/demo\.admin@example\.com/).length).toBeGreaterThan(0)
    expect(screen.getByText('FOWOCO Demo Company')).toBeInTheDocument()
  })

  it('edits and saves the editable fields, persisting through the API', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findAllByText('김민지 HR')
    await user.click(screen.getByRole('button', { name: '프로필 수정' }))
    const displayNameInput = screen.getByLabelText('표시 이름')
    await user.clear(displayNameInput)
    await user.type(displayNameInput, '김민지 매니저')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect((await screen.findAllByText('김민지 매니저')).length).toBeGreaterThan(0)
    expect(screen.getByText('프로필을 저장했습니다.')).toBeInTheDocument()

    const patchCall = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'PATCH')
    expect(patchCall).toBeTruthy()
    expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({
      display_name: '김민지 매니저',
      phone: '010-0000-1234',
    })
  })

  it('discards edits when cancelled', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findAllByText('김민지 HR')
    await user.click(screen.getByRole('button', { name: '프로필 수정' }))
    const displayNameInput = screen.getByLabelText('표시 이름')
    await user.clear(displayNameInput)
    await user.type(displayNameInput, '지워질 이름')
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.getAllByText('김민지 HR')[0]).toBeInTheDocument()
    expect(screen.queryByText('지워질 이름')).not.toBeInTheDocument()
  })

  it('blocks saving when display name is cleared and shows a validation error', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findAllByText('김민지 HR')
    await user.click(screen.getByRole('button', { name: '프로필 수정' }))
    await user.clear(screen.getByLabelText('표시 이름'))
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(screen.getByText('표시 이름을 입력해 주세요.')).toBeInTheDocument()
    // 저장 실패했으니 편집 모드가 유지돼야 한다.
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
  })

  it('rejects a display name made up of only digits', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findAllByText('김민지 HR')
    await user.click(screen.getByRole('button', { name: '프로필 수정' }))
    const nameInput = screen.getByLabelText('표시 이름')
    await user.clear(nameInput)
    await user.type(nameInput, '12345')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(screen.getByText('이름에 숫자만 입력할 수 없습니다.')).toBeInTheDocument()
  })

  it('shows a toast when requesting an email change', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findAllByText('김민지 HR')
    await user.click(screen.getByRole('button', { name: '이메일 변경 요청 →' }))

    expect(screen.getByText('이메일 변경 요청을 관리자에게 전달했습니다.')).toBeInTheDocument()
  })

  it('toggles a notification preference', async () => {
    const user = userEvent.setup()
    renderPage()

    const toggle = screen.getByRole('switch', { name: '담당자 지정' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('shows the mandatory security notification as a disabled, always-on toggle', async () => {
    const user = userEvent.setup()
    renderPage()

    const toggle = screen.getByRole('switch', { name: '보안·권한 변경 알림' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(toggle).toBeDisabled()

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('navigates to reset-password when "비밀번호 변경" is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }))

    expect(await screen.findByText('비밀번호 재설정 페이지')).toBeInTheDocument()
  })

  it('shows a placeholder toast for login history', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '로그인 기록 보기' }))

    expect(screen.getByText('로그인 기록 보기는 준비 중입니다.')).toBeInTheDocument()
  })

  it('blocks navigation while editing and lets the user continue editing', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findAllByText('김민지 HR')
    await user.click(screen.getByRole('button', { name: '프로필 수정' }))
    await user.type(screen.getByLabelText('연락처'), '9')
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }))

    expect(
      screen.getByRole('dialog', { name: '저장하지 않은 변경사항이 있습니다.' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/변경사항 1개/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '계속 수정' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
  })

  it('discards changes and leaves when "저장하지 않고 나가기" is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findAllByText('김민지 HR')
    await user.click(screen.getByRole('button', { name: '프로필 수정' }))
    await user.type(screen.getByLabelText('연락처'), '9')
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }))
    await user.click(screen.getByRole('button', { name: '저장하지 않고 나가기' }))

    expect(await screen.findByText('비밀번호 재설정 페이지')).toBeInTheDocument()
  })

  it('saves changes and leaves when "변경사항 저장" is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findAllByText('김민지 HR')
    await user.click(screen.getByRole('button', { name: '프로필 수정' }))
    await user.type(screen.getByLabelText('연락처'), '9')
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }))
    await user.click(screen.getByRole('button', { name: '변경사항 저장' }))

    expect(await screen.findByText('비밀번호 재설정 페이지')).toBeInTheDocument()
  })
})
