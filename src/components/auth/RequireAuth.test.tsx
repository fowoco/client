import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RequireAuth } from './RequireAuth'
import { useAuthStore } from '../../store/authStore'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function renderWithAuth(initialPath: string) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <p>login screen</p> },
      {
        element: <RequireAuth />,
        children: [{ path: '/dashboard', element: <p>dashboard screen</p> }],
      },
    ],
    { initialEntries: [initialPath] },
  )
  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }))
  await useAuthStore.getState().logout()
  vi.unstubAllGlobals()
})

describe('RequireAuth', () => {
  it('redirects to login when there is no valid session to restore', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }))

    renderWithAuth('/dashboard')

    expect(await screen.findByText('login screen')).toBeInTheDocument()
  })

  it('renders the protected route when a user is already logged in', async () => {
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
    await useAuthStore.getState().login('mini@naver.com', '1234')

    renderWithAuth('/dashboard')

    expect(await screen.findByText('dashboard screen')).toBeInTheDocument()
    // status was already 'ready' from login(), so no extra /auth/refresh call should fire.
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
