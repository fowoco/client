import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeaderActions } from './HeaderActions'
import { getSafeNotificationRoute } from './notificationPresentation'

const USER = { name: '김민지', workplace: '한빛정밀', role: 'HR' }
const NOTIFICATIONS = {
  items: [
    {
      id: 'n1',
      target_type: 'TASK',
      target_id: 'task-1',
      route: '/tasks/task-1',
      title: '체류연장 요청문 승인이 필요합니다.',
      read: false,
      occurred_at: '2026-08-10T01:00:00Z',
    },
    {
      id: 'n2',
      target_type: 'DOCUMENT',
      target_id: 'document-1',
      route: '/documents/document-1',
      title: '서류 검토가 완료됐습니다.',
      read: true,
      occurred_at: '2026-08-09T01:00:00Z',
    },
  ],
  unread_count: 1,
  has_next: false,
  next_cursor: null,
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderActions(onLogout = vi.fn()) {
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <>
            <HeaderActions user={USER} onLogout={onLogout} />
            <p data-testid="location">화면</p>
          </>
        ),
      },
    ],
    { initialEntries: ['/dashboard'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
      init?.method === 'POST' ? new Response(null, { status: 204 }) : jsonResponse(NOTIFICATIONS),
    ),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('HeaderActions', () => {
  it('shows the server unread notification count as a badge', async () => {
    renderActions()

    expect(await screen.findByLabelText('알림 1건 안 읽음')).toBeInTheDocument()
  })

  it('opens the notification panel and lists server notifications', async () => {
    const user = userEvent.setup()
    renderActions()

    await user.click(await screen.findByLabelText('알림 1건 안 읽음'))

    expect(screen.getByText(NOTIFICATIONS.items[0].title)).toBeInTheDocument()
    expect(screen.getByText(NOTIFICATIONS.items[1].title)).toBeInTheDocument()
  })

  it('marks an unread notification as read before navigating to its route', async () => {
    const user = userEvent.setup()
    const router = renderActions()

    await user.click(await screen.findByLabelText('알림 1건 안 읽음'))
    await user.click(screen.getByRole('menuitem', { name: /체류연장 요청문 승인이 필요합니다/ }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/tasks/task-1'))
    expect(vi.mocked(fetch).mock.calls.some(([url, init]) =>
      String(url).includes('/notifications/n1/read') && init?.method === 'POST',
    )).toBe(true)
  })

  it('shows an error and keeps the panel open when read processing fails', async () => {
    vi.mocked(fetch).mockImplementation(async (_input, init) => {
      if (init?.method === 'POST') {
        return jsonResponse({
          timestamp: '2026-08-10T01:00:00Z',
          status: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'failed',
          path: '/api/v1/notifications/n1/read',
          request_id: 'request-1',
          field_errors: [],
        }, 500)
      }
      return jsonResponse(NOTIFICATIONS)
    })
    const user = userEvent.setup()
    const router = renderActions()

    await user.click(await screen.findByLabelText('알림 1건 안 읽음'))
    await user.click(screen.getByRole('menuitem', { name: /체류연장 요청문 승인이 필요합니다/ }))

    expect(await screen.findByText('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/dashboard')
    expect(screen.getByRole('menu', { name: '알림 목록' })).toBeInTheDocument()
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

    await user.click(await screen.findByLabelText('알림 1건 안 읽음'))
    expect(screen.getByText(NOTIFICATIONS.items[0].title)).toBeInTheDocument()

    await user.click(screen.getByText('김민지 HR'))
    expect(screen.queryByText(NOTIFICATIONS.items[0].title)).not.toBeInTheDocument()
  })
})

describe('getSafeNotificationRoute', () => {
  it('keeps expected internal routes and rejects external or unexpected routes', () => {
    expect(getSafeNotificationRoute('/documents/document-1?tab=ocr')).toBe('/documents/document-1?tab=ocr')
    expect(getSafeNotificationRoute('https://example.com')).toBe('/dashboard')
    expect(getSafeNotificationRoute('//example.com/tasks/1')).toBe('/dashboard')
    expect(getSafeNotificationRoute('/profile')).toBe('/dashboard')
  })
})
