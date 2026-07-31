import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { ProfilePage } from './ProfilePage'

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
      { path: '/settings', element: <p>설정 페이지</p> },
      { path: '/reset-password', element: <p>비밀번호 재설정 페이지</p> },
    ],
    { initialEntries: ['/profile'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('ProfilePage', () => {
  it('renders the profile summary and read-only fields', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: '내 프로필' })).toBeInTheDocument()
    expect(screen.getByText('김민지 HR')).toBeInTheDocument()
    expect(screen.getByText('010-0000-1234')).toBeInTheDocument()
    expect(screen.getByText('hr.demo@fowoco.example')).toBeInTheDocument()
    expect(screen.getByText('체류·문서 운영')).toBeInTheDocument()
  })

  it('edits and saves the editable fields', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '프로필 수정' }))
    const displayNameInput = screen.getByLabelText('표시 이름')
    await user.clear(displayNameInput)
    await user.type(displayNameInput, '김민지 매니저')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(screen.getByText('김민지 매니저')).toBeInTheDocument()
    expect(screen.getByText('프로필을 저장했습니다.')).toBeInTheDocument()
  })

  it('discards edits when cancelled', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '프로필 수정' }))
    const displayNameInput = screen.getByLabelText('표시 이름')
    await user.clear(displayNameInput)
    await user.type(displayNameInput, '지워질 이름')
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.getByText('김민지 HR')).toBeInTheDocument()
    expect(screen.queryByText('지워질 이름')).not.toBeInTheDocument()
  })

  it('blocks saving when name is cleared and shows a validation error', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '프로필 수정' }))
    await user.clear(screen.getByLabelText('이름'))
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(screen.getByText('이름을 입력해 주세요.')).toBeInTheDocument()
    // 저장 실패했으니 편집 모드가 유지돼야 한다.
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
  })

  it('rejects a name made up of only digits', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '프로필 수정' }))
    const nameInput = screen.getByLabelText('이름')
    await user.clear(nameInput)
    await user.type(nameInput, '12345')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(screen.getByText('이름에 숫자만 입력할 수 없습니다.')).toBeInTheDocument()
  })

  it('shows a toast when requesting an email change', async () => {
    const user = userEvent.setup()
    renderPage()

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

  it('navigates to settings when "설정에서 권한 보기" is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '설정에서 권한 보기' }))

    expect(await screen.findByText('설정 페이지')).toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: '프로필 수정' }))
    await user.type(screen.getByLabelText('연락처'), '9')
    await user.click(screen.getByRole('button', { name: '설정에서 권한 보기' }))

    expect(screen.getByRole('dialog', { name: '저장하지 않은 변경사항이 있습니다.' })).toBeInTheDocument()
    expect(screen.getByText(/변경사항 1개/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '계속 수정' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
  })

  it('discards changes and leaves when "저장하지 않고 나가기" is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '프로필 수정' }))
    await user.type(screen.getByLabelText('연락처'), '9')
    await user.click(screen.getByRole('button', { name: '설정에서 권한 보기' }))
    await user.click(screen.getByRole('button', { name: '저장하지 않고 나가기' }))

    expect(await screen.findByText('설정 페이지')).toBeInTheDocument()
  })

  it('saves changes and leaves when "변경사항 저장" is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '프로필 수정' }))
    await user.type(screen.getByLabelText('연락처'), '9')
    await user.click(screen.getByRole('button', { name: '설정에서 권한 보기' }))
    await user.click(screen.getByRole('button', { name: '변경사항 저장' }))

    expect(await screen.findByText('설정 페이지')).toBeInTheDocument()
  })
})
