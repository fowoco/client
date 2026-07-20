import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppLayout } from './AppLayout'
import { NAV_ITEMS } from './navItems'

describe('AppLayout', () => {
  it('renders the FOWOCO logo and every nav item', () => {
    const router = createMemoryRouter(
      [{ element: <AppLayout />, children: [{ path: '/dashboard', element: <p>content</p> }] }],
      { initialEntries: ['/dashboard'] },
    )
    render(<RouterProvider router={router} />)

    expect(screen.getByText('FOWOCO')).toBeInTheDocument()
    for (const item of NAV_ITEMS) {
      expect(screen.getByRole('link', { name: item.label })).toBeInTheDocument()
    }
  })
})
