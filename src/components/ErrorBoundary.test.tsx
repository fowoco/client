import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('boom')
}

beforeEach(() => {
  // React가 잡힌 에러를 콘솔에 또 찍어서 테스트 출력이 시끄러워지는 것만 막는다.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <p>정상 화면</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('정상 화면')).toBeInTheDocument()
  })

  it('shows a fallback screen instead of crashing when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새로고침' })).toBeInTheDocument()
  })

  it('reloads the page when 새로고침 is clicked', async () => {
    const user = userEvent.setup()
    const reload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    })

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    await user.click(screen.getByRole('button', { name: '새로고침' }))

    expect(reload).toHaveBeenCalled()
  })
})
