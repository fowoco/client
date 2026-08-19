import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LegalPolicyPage } from './LegalPolicyPage'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          password_policy: {
            min_length: 8,
            max_length: 128,
            require_letter: true,
            require_digit: true,
          },
          agreements: {
            service_terms: { version: '2.0', required: true, content_path: '/legal/terms' },
            privacy_policy: {
              version: '3.0',
              required: true,
              content_path: '/legal/privacy',
            },
            marketing: { version: '1.0', required: false, content_path: null },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    ),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LegalPolicyPage', () => {
  it('renders the service terms and current version', async () => {
    render(
      <MemoryRouter>
        <LegalPolicyPage kind="terms" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '서비스 이용약관' })).toBeInTheDocument()
    expect(await screen.findByText(/버전 2.0/)).toBeInTheDocument()
    expect(screen.getByText('3. AI 업무보조의 범위')).toBeInTheDocument()
  })

  it('renders the privacy processing notice and current version', async () => {
    render(
      <MemoryRouter>
        <LegalPolicyPage kind="privacy" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '개인정보 처리 안내' })).toBeInTheDocument()
    expect(await screen.findByText(/버전 3.0/)).toBeInTheDocument()
    expect(screen.getByText('3. 보관과 접근')).toBeInTheDocument()
  })
})
