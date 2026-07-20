import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { RequireAuth } from './RequireAuth'
import { useAuthStore } from '../../store/authStore'

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

describe('RequireAuth', () => {
  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('redirects to login when there is no authenticated user', () => {
    renderWithAuth('/dashboard')
    expect(screen.getByText('login screen')).toBeInTheDocument()
  })

  it('renders the protected route when a user is logged in', () => {
    useAuthStore.getState().login('mini@naver.com', '1234')
    renderWithAuth('/dashboard')
    expect(screen.getByText('dashboard screen')).toBeInTheDocument()
  })
})
