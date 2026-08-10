import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { CompanySettingsPanel } from './CompanySettingsPanel'

const SETTINGS = {
  approval_policy: 'ADMIN_OR_HR',
  link_expiry_hours: 72,
  evidence_rules: { RECONTRACT: ['DOCUMENT'] },
  file_retention_days: 365,
  ai_log_retention_days: 90,
  audit_visibility: 'ADMIN_ONLY',
  version: 3,
}

const MEMBERS = {
  items: [
    {
      user_id: 'user-1',
      display_name: '김관리',
      roles: ['ADMIN'],
      active: true,
      approval_permission: true,
    },
    {
      user_id: 'user-2',
      display_name: '이인사',
      roles: ['HR'],
      active: true,
      approval_permission: false,
    },
  ],
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderPanel() {
  render(
    <>
      <CompanySettingsPanel />
      <ToastViewport />
    </>,
  )
}

beforeEach(() => {
  useAuthStore.setState({
    user: { name: 'admin', workplace: 'FOWOCO', role: 'ADMIN' },
    status: 'ready',
  })
  useToastStore.setState({ toasts: [] })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/company-members')) return jsonResponse(MEMBERS)
      if (url.includes('/settings') && init?.method === 'PATCH') {
        return jsonResponse({ ...SETTINGS, ...JSON.parse(init.body as string), version: 4 })
      }
      return jsonResponse(SETTINGS)
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('CompanySettingsPanel', () => {
  it('loads settings and the detailed company member projection', async () => {
    renderPanel()

    expect(await screen.findByDisplayValue('ADMIN 또는 HR 승인')).toBeInTheDocument()
    expect(screen.getByText('김관리')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(screen.getByText('승인 가능')).toBeInTheDocument()
  })

  it('lets ADMIN update settings with the latest expected_version', async () => {
    const user = userEvent.setup()
    renderPanel()

    const expiryInput = await screen.findByLabelText('보안 링크 만료시간')
    await user.clear(expiryInput)
    await user.type(expiryInput, '48')
    await user.click(screen.getByLabelText('체류기간 연장 기관 결과'))
    await user.click(screen.getByRole('button', { name: '회사 설정 저장' }))

    await waitFor(() => {
      const patchCall = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'PATCH')
      expect(patchCall).toBeDefined()
      expect(JSON.parse(patchCall?.[1]?.body as string)).toMatchObject({
        expected_version: 3,
        link_expiry_hours: 48,
        evidence_rules: {
          RECONTRACT: ['DOCUMENT'],
          STAY_PERIOD_EXTENSION: ['OFFICIAL_RESULT'],
        },
      })
    })
    expect(await screen.findByText('회사 설정을 저장했습니다.')).toBeInTheDocument()
  })

  it('renders HR and VIEWER settings as read-only', async () => {
    useAuthStore.setState({ user: { name: 'hr', workplace: 'FOWOCO', role: 'HR' } })
    renderPanel()

    expect(await screen.findByText('HR 조회 전용')).toBeInTheDocument()
    expect(await screen.findByLabelText('보안 링크 만료시간')).toBeDisabled()
    expect(screen.queryByRole('button', { name: '회사 설정 저장' })).not.toBeInTheDocument()
  })

  it('refetches the latest settings after a 409 conflict', async () => {
    let settingsGetCount = 0
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.includes('/company-members')) return jsonResponse(MEMBERS)
      if (init?.method === 'PATCH') {
        return jsonResponse({
          timestamp: '2026-08-10T01:00:00Z',
          status: 409,
          code: 'CONCURRENT_MODIFICATION',
          message: 'conflict',
          path: '/api/v1/settings',
          request_id: 'request-1',
          field_errors: [],
        }, 409)
      }
      settingsGetCount += 1
      return jsonResponse(
        settingsGetCount === 1
          ? SETTINGS
          : { ...SETTINGS, link_expiry_hours: 24, version: 4 },
      )
    })
    const user = userEvent.setup()
    renderPanel()

    await screen.findByDisplayValue('72')
    await user.click(screen.getByRole('button', { name: '회사 설정 저장' }))

    expect(await screen.findByText(/다른 관리자가 먼저 설정을 변경했습니다/)).toBeInTheDocument()
    expect(await screen.findByDisplayValue('24')).toBeInTheDocument()
    expect(screen.getByText('설정 버전 4')).toBeInTheDocument()
  })

  it('shows a recoverable error when settings cannot be loaded', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      if (String(input).includes('/company-members')) return jsonResponse(MEMBERS)
      return jsonResponse({
        timestamp: '2026-08-10T01:00:00Z',
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'failed',
        path: '/api/v1/settings',
        request_id: 'request-1',
        field_errors: [],
      }, 500)
    })

    renderPanel()

    expect(await screen.findByText('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })
})
