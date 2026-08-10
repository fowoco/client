import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchCompanyMembers,
  fetchCompanySettings,
  patchCompanySettings,
} from './settings'

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => vi.unstubAllGlobals())

describe('company settings API', () => {
  it('gets the public company settings projection', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ version: 3 }))

    await fetchCompanySettings()

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/settings')
    expect(init?.method).toBeUndefined()
  })

  it('patches settings with expected_version', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ version: 4 }))

    await patchCompanySettings({
      expected_version: 3,
      approval_policy: 'ADMIN_ONLY',
      link_expiry_hours: 48,
    })

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/settings')
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(init?.body as string)).toEqual({
      expected_version: 3,
      approval_policy: 'ADMIN_ONLY',
      link_expiry_hours: 48,
    })
  })
})
describe('company members API', () => {
  it('gets active members with optional role and approval filters', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ items: [] }))

    await fetchCompanyMembers({ role: 'HR', approvalCapable: true, activeOnly: false })

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/company-members?')
    expect(String(url)).toContain('role=HR')
    expect(String(url)).toContain('approval_capable=true')
    expect(String(url)).toContain('active_only=false')
  })
})
