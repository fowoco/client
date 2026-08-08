import { lazy, type ComponentType } from 'react'
import { act, render, screen } from '@testing-library/react'
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

  it('announces route loading while a lazy page chunk is resolving', async () => {
    let resolvePage!: (module: { default: ComponentType }) => void
    const LazyPage = lazy(
      () =>
        new Promise<{ default: ComponentType }>((resolve) => {
          resolvePage = resolve
        }),
    )
    const router = createMemoryRouter(
      [{ element: <RouteTransition />, children: [{ path: '/tasks', element: <LazyPage /> }] }],
      { initialEntries: ['/tasks'] },
    )
    render(<RouterProvider router={router} />)

    expect(screen.getByRole('status')).toHaveTextContent('화면을 불러오는 중입니다')

    await act(async () => {
      resolvePage({ default: () => <p>lazy task content</p> })
    })

    expect(await screen.findByText('lazy task content')).toBeInTheDocument()
  })
})
