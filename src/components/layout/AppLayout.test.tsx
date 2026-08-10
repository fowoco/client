import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppLayout } from './AppLayout'
import { NAV_ITEMS } from './navItems'

const EMPTY_TODAY_RESPONSE = {
  summary_counts: {
    pending_approval: 0,
    due_today: 0,
    needs_info: 0,
    worker_response: 0,
  },
  priority_tasks: [],
  upcoming_7_days: [],
  recommendations: {
    connected_count: 0,
    prepared: [],
    review: [],
    after_approval: [],
  },
  approval_count: 0,
  worker_response_count: 0,
}

const EMPTY_NOTIFICATION_RESPONSE = {
  items: [],
  page: 0,
  size: 20,
  total_elements: 0,
  total_pages: 0,
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function requestUrl(input: RequestInfo | URL) {
  return typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
}

function renderLayout() {
  const router = createMemoryRouter(
    [{ element: <AppLayout />, children: [{ path: '/dashboard', element: <p>content</p> }] }],
    { initialEntries: ['/dashboard'] },
  )
  render(<RouterProvider router={router} />)
}

// 이 테스트 환경은 Node 내장 localStorage가 jsdom 것보다 먼저 잡혀서 메서드 호출이 아예
// 실패한다 (authStore.test.ts와 동일한 이슈, 여기선 항상 재현됨). fetch를 stub하는 것과
// 같은 방식으로 실제 동작하는 in-memory 구현을 매 테스트마다 새로 주입한다.
function stubWorkingLocalStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  })
}

beforeEach(() => {
  stubWorkingLocalStorage()
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = requestUrl(input)
      return Promise.resolve(
        jsonResponse(url.includes('/notifications') ? EMPTY_NOTIFICATION_RESPONSE : EMPTY_TODAY_RESPONSE),
      )
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AppLayout', () => {
  it('renders the current global navigation without a workers tab', () => {
    localStorage.setItem('fowoco.onboarding.completed', 'true')
    renderLayout()

    expect(screen.getByText('FOWOCO')).toBeInTheDocument()
    for (const item of NAV_ITEMS) {
      expect(screen.getByRole('link', { name: item.label })).toBeInTheDocument()
    }
    expect(screen.queryByRole('link', { name: '근로자' })).not.toBeInTheDocument()
  })

  it('shows server-backed work shortcut counts and routes them to focused inbox views', async () => {
    localStorage.setItem('fowoco.onboarding.completed', 'true')
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = requestUrl(input)
      return Promise.resolve(
        jsonResponse(
          url.includes('/notifications')
            ? EMPTY_NOTIFICATION_RESPONSE
            : {
                ...EMPTY_TODAY_RESPONSE,
                summary_counts: {
                  pending_approval: 4,
                  due_today: 1,
                  needs_info: 2,
                  worker_response: 3,
                },
              },
        ),
      )
    })

    renderLayout()

    expect(await screen.findByRole('link', { name: '승인 대기 4' })).toHaveAttribute(
      'href',
      '/tasks?focus=pending-approval',
    )
    expect(screen.getByRole('link', { name: '정보 보완 2' })).toHaveAttribute(
      'href',
      '/tasks?focus=needs-info',
    )
    expect(screen.getByRole('link', { name: '응답 대기 3' })).toHaveAttribute(
      'href',
      '/tasks?focus=worker-response',
    )
    expect(screen.getByRole('link', { name: '오늘 마감 1' })).toHaveAttribute(
      'href',
      '/tasks?focus=due-today',
    )
  })

  it('opens and closes the mobile sidebar without changing the route', async () => {
    localStorage.setItem('fowoco.onboarding.completed', 'true')
    const user = userEvent.setup()
    renderLayout()

    const openButton = screen.getByRole('button', { name: '사이드바 열기' })
    expect(openButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(openButton)
    expect(openButton).toHaveAttribute('aria-expanded', 'true')

    const closeButtons = screen.getAllByRole('button', { name: '사이드바 닫기' })
    await user.click(closeButtons[0])
    expect(openButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens and closes the help modal', async () => {
    localStorage.setItem('fowoco.onboarding.completed', 'true')
    const user = userEvent.setup()
    renderLayout()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await screen.findByRole('link', { name: '승인 대기 0' })
    await user.click(screen.getByRole('button', { name: '도움말' }))
    expect(screen.getByRole('dialog', { name: '도움말' })).toBeInTheDocument()

    const closeButtons = screen.getAllByRole('button', { name: '닫기' })
    await user.click(closeButtons[closeButtons.length - 1])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the onboarding tour automatically on first visit', () => {
    renderLayout()

    expect(screen.getByRole('dialog', { name: 'FOWOCO에 오신 것을 환영합니다' })).toBeInTheDocument()
  })

  it('does not show the onboarding tour again once completed', () => {
    localStorage.setItem('fowoco.onboarding.completed', 'true')
    renderLayout()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('walks through every onboarding step and persists completion on finish', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(screen.getByRole('dialog', { name: 'Today·업무함에서 우선순위를 확인하세요' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(screen.getByRole('dialog', { name: '무엇이든 요청하면 Agent가 초안을 준비합니다' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '시작하기' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(localStorage.getItem('fowoco.onboarding.completed')).toBe('true')
  })

  it('skips the tour and still marks it completed', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: '건너뛰기' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(localStorage.getItem('fowoco.onboarding.completed')).toBe('true')
  })

  it('replays the tour from the help modal', async () => {
    localStorage.setItem('fowoco.onboarding.completed', 'true')
    const user = userEvent.setup()
    renderLayout()

    await screen.findByRole('link', { name: '승인 대기 0' })
    await user.click(screen.getByRole('button', { name: '도움말' }))
    await user.click(screen.getByRole('button', { name: '시작 가이드 다시 보기 →' }))

    expect(screen.queryByRole('dialog', { name: '도움말' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'FOWOCO에 오신 것을 환영합니다' })).toBeInTheDocument()
  })
})
