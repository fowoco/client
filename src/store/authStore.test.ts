import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAccessToken } from '../api/client'
import { useAuthStore } from './authStore'

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function errorResponse(status: number, code: string, message: string) {
  return jsonResponse(
    {
      timestamp: '2026-07-22T01:23:45Z',
      status,
      code,
      message,
      path: '/api/v1/auth/login',
      request_id: 'req-1',
      field_errors: [],
    },
    { status },
  )
}

// Node의 실험적 전역 localStorage가 jsdom 것보다 먼저 잡혀서 --localstorage-file 없이는
// 메서드 호출이 실패하는 환경이 있다 (이 저장소에서 이미 한 번 겪은 문제). 테스트에서도
// 구현과 동일하게 try/catch로 감싸 환경에 상관없이 동작하게 한다.
function clearTestLocalStorage() {
  try {
    localStorage.clear()
  } catch {
    // noop
  }
}

function setTestLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // noop — 이 경우 해당 테스트는 실행 환경에서 의미가 없으므로 아래 restoreSession 테스트가
    // fallback 이름("사용자")으로 통과하는지도 함께 확인한다.
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  clearTestLocalStorage()
})

afterEach(async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }))
  await useAuthStore.getState().logout()
  vi.unstubAllGlobals()
})

describe('useAuthStore.login', () => {
  it('stores the access token and user profile on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        user_id: 'u-1',
        company_id: 'c-1',
        company_name: '한빛정밀',
        role: 'HR',
        access_token: 'access-1',
        token_type: 'Bearer',
        expires_in_seconds: 900,
        expires_at: '2026-07-22T01:15:00Z',
      }),
    )

    const result = await useAuthStore.getState().login('mini@naver.com', '1234')

    expect(result).toEqual({ success: true })
    expect(getAccessToken()).toBe('access-1')
    expect(useAuthStore.getState().user).toEqual({ name: 'mini', workplace: '한빛정밀', role: 'HR' })
    expect(useAuthStore.getState().status).toBe('ready')
  })

  it('returns a translated error message on invalid credentials', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      errorResponse(401, 'INVALID_CREDENTIALS', 'raw'),
    )

    const result = await useAuthStore.getState().login('wrong@example.com', 'wrongpass')

    expect(result).toEqual({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('does not retry via refresh when login itself returns 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(401, 'INVALID_CREDENTIALS', 'raw'))

    await useAuthStore.getState().login('wrong@example.com', 'wrongpass')

    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe('useAuthStore.logout', () => {
  it('clears the user and access token even if the request fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('network down'))

    await useAuthStore.getState().logout()

    expect(useAuthStore.getState().user).toBeNull()
    expect(getAccessToken()).toBeNull()
  })
})

describe('useAuthStore.restoreSession', () => {
  it('restores the user from a valid refresh cookie plus /auth/me', async () => {
    // 이 프로젝트의 테스트 환경에서는 Node 내장 localStorage가 jsdom 것보다 먼저 잡혀
    // 저장이 조용히 실패할 수 있다 (구현도 이 상황을 try/catch로 감내하도록 설계했다).
    // 그래서 여기서는 실제로 저장에 성공했는지를 먼저 확인하고, 그 결과에 맞는 기대값으로
    // 검증한다 — 저장에 성공하면 저장된 이름을, 실패하면 authStore의 fallback("사용자")을 기대한다.
    setTestLocalStorage('fowoco.auth.profile', JSON.stringify({ name: 'mini', workplace: '한빛정밀' }))
    let expectedName = '사용자'
    let expectedWorkplace = ''
    try {
      const raw = localStorage.getItem('fowoco.auth.profile')
      if (raw) {
        const parsed = JSON.parse(raw) as { name: string; workplace: string }
        expectedName = parsed.name
        expectedWorkplace = parsed.workplace
      }
    } catch {
      // fallback 값 유지
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: 'refreshed-token',
          token_type: 'Bearer',
          expires_in_seconds: 900,
          expires_at: '2026-07-22T01:15:00Z',
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ user_id: 'u-1', company_id: 'c-1', roles: ['HR'] }))

    await useAuthStore.getState().restoreSession()

    expect(useAuthStore.getState().status).toBe('ready')
    expect(useAuthStore.getState().user).toEqual({
      name: expectedName,
      workplace: expectedWorkplace,
      role: 'HR',
    })
    expect(getAccessToken()).toBe('refreshed-token')
  })

  it('leaves the user logged out when there is no valid refresh cookie', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }))

    await useAuthStore.getState().restoreSession()

    expect(useAuthStore.getState().status).toBe('ready')
    expect(useAuthStore.getState().user).toBeNull()
  })
})
