import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { NotFoundPage } from './NotFoundPage'

describe('NotFoundPage', () => {
  it('renders a 404 message for unmatched routes', () => {
    const router = createMemoryRouter(
      [{ path: '/dashboard', element: <p>dashboard</p>, errorElement: <NotFoundPage /> }],
      { initialEntries: ['/unknown-route'] },
    )
    render(<RouterProvider router={router} />)

    expect(screen.getByText('페이지를 찾을 수 없습니다')).toBeInTheDocument()
  })
})
