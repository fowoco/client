import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { HeaderActions } from './HeaderActions'
import { HEADER_NOTIFICATIONS } from './headerNotifications'

const USER = { name: '김민지', workplace: '한빛정밀', role: 'HR' }

function renderActions(onLogout = vi.fn()) {
  render(
    <MemoryRouter>
      <HeaderActions user={USER} onLogout={onLogout} />
    </MemoryRouter>,
  )
}

describe('HeaderActions', () => {
  it('shows the unread notification count as a badge', () => {
    renderActions()
    const unreadCount = HEADER_NOTIFICATIONS.filter((n) => !n.read).length
    expect(screen.getByLabelText(`알림 ${unreadCount}건 안 읽음`)).toBeInTheDocument()
  })

  it('opens the notification panel and lists notifications', async () => {
    const user = userEvent.setup()
    renderActions()

    await user.click(screen.getByLabelText(/알림/))

    expect(screen.getByText(HEADER_NOTIFICATIONS[0].title)).toBeInTheDocument()
  })

  it('shows the name/role in the profile trigger', () => {
    renderActions()
    expect(screen.getByText('김민지 HR')).toBeInTheDocument()
  })

  it('opens the profile menu with a link to profile and a logout action', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    renderActions(onLogout)

    await user.click(screen.getByText('김민지 HR'))

    expect(screen.getByRole('link', { name: '내 프로필' })).toHaveAttribute('href', '/profile')

    await user.click(screen.getByRole('button', { name: '로그아웃' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('closes the notification panel when the profile menu is opened', async () => {
    const user = userEvent.setup()
    renderActions()

    await user.click(screen.getByLabelText(/알림/))
    expect(screen.getByText(HEADER_NOTIFICATIONS[0].title)).toBeInTheDocument()

    await user.click(screen.getByText('김민지 HR'))
    expect(screen.queryByText(HEADER_NOTIFICATIONS[0].title)).not.toBeInTheDocument()
  })
})
