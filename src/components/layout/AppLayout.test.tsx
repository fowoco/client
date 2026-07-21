import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppLayout } from './AppLayout'
import { NAV_ITEMS } from './navItems'

function renderLayout() {
  const router = createMemoryRouter(
    [{ element: <AppLayout />, children: [{ path: '/dashboard', element: <p>content</p> }] }],
    { initialEntries: ['/dashboard'] },
  )
  render(<RouterProvider router={router} />)
}

describe('AppLayout', () => {
  it('renders the FOWOCO logo and every nav item', () => {
    renderLayout()

    expect(screen.getByText('FOWOCO')).toBeInTheDocument()
    for (const item of NAV_ITEMS) {
      expect(screen.getByRole('link', { name: item.label })).toBeInTheDocument()
    }
  })

  it('opens and closes the help modal', async () => {
    const user = userEvent.setup()
    renderLayout()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '? 도움말' }))
    expect(screen.getByRole('dialog', { name: '도움말' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
