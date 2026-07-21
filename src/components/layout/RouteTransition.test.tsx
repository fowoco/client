import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { RouteTransition } from './RouteTransition'

describe('RouteTransition', () => {
  it('renders the matched child route inside the transition wrapper', () => {
    const router = createMemoryRouter(
      [{ element: <RouteTransition />, children: [{ path: '/dashboard', element: <p>dashboard content</p> }] }],
      { initialEntries: ['/dashboard'] },
    )
    render(<RouterProvider router={router} />)

    expect(screen.getByText('dashboard content')).toBeInTheDocument()
  })
})
