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
          account_protection: {
            max_failed_attempts: 5,
            lock_duration_seconds: 900,
            password_max_age_days: 180,
          },
          agreements: {
            service_terms: { version: '2.0', required: true, content_path: '/legal/terms' },
            privacy_policy: {
              version: '3.0',
              required: true,
              content_path: '/legal/privacy',
            },
            marketing: {
              version: '1.0',
              required: false,
              content_path: '/legal/marketing',
            },
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
    expect(screen.getByRole('heading', { name: '3. AI 업무보조의 범위' })).toBeInTheDocument()
  })

  it('renders the privacy processing notice and current version', async () => {
    render(
      <MemoryRouter>
        <LegalPolicyPage kind="privacy" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '개인정보 처리 안내' })).toBeInTheDocument()
    expect(await screen.findByText(/버전 3.0/)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '5. 업로드 문서의 검증과 저장' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/일반 문서와 근로자 제출 파일은 파일당 최대 20MB/)).toBeInTheDocument()
  })

  it('renders the optional marketing notice and current version', async () => {
    render(
      <MemoryRouter>
        <LegalPolicyPage kind="marketing" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '제품 소식 수신 안내' })).toBeInTheDocument()
    expect(await screen.findByText(/버전 1.0/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '5. 선택 동의의 영향' })).toBeInTheDocument()
  })
})
