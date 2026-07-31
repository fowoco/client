import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IntroPage } from './IntroPage'

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <IntroPage />
    </MemoryRouter>,
  )
}

describe('IntroPage', () => {
  it('renders the hero headline and CTA links', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: /준비하고 사람이 결정합니다\./ }),
    ).toBeInTheDocument()
    const startLinks = screen.getAllByRole('link', { name: 'FOWOCO 시작하기 →' })
    expect(startLinks.length).toBeGreaterThan(0)
    startLinks.forEach((link) => expect(link).toHaveAttribute('href', '/signup'))
    expect(screen.getAllByRole('link', { name: '로그인' })[0]).toHaveAttribute('href', '/login')
  })

  it('renders all six feature cards', () => {
    renderPage()

    expect(screen.getByText('업무 준비 Agent')).toBeInTheDocument()
    expect(screen.getByText('기한·누락 감지')).toBeInTheDocument()
  })

  it('renders a dot for each section', () => {
    renderPage()

    const nav = screen.getByRole('navigation', { name: '섹션 이동' })
    expect(nav.querySelectorAll('button')).toHaveLength(6)
  })
})
