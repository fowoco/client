import { ApiError, networkApiError, type ApiErrorBody } from './errors'

// fowoco/server ADR-0002 기준: HR·Admin·Viewer API는 /api/v1 아래, JSON은 snake_case.
// 이 파일은 snake_case를 그대로 유지한다 — 각 도메인 API 모듈이 필요한 필드만
// 명시적으로 다루도록 하고, 응답 전체를 자동으로 camelCase 변환하지 않는다.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

// #101(실제 인증 연동)에서 refresh 재시도까지 실패했을 때 로그아웃 처리를 연결한다.
// client.ts는 인증 스토어를 직접 import하지 않아, 이 모듈만 단독으로 테스트할 수 있다.
let authExpiredHandler: (() => void) | null = null

export function setAuthExpiredHandler(handler: (() => void) | null) {
  authExpiredHandler = handler
}

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  // 동시에 여러 요청이 401을 받아도 refresh 호출은 한 번만 나가도록 single-flight로 묶는다.
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        if (!response.ok) return false
        const body = (await response.json()) as { access_token: string }
        setAccessToken(body.access_token)
        return true
      } catch {
        return false
      }
    })()
  }

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

async function parseErrorBody(response: Response, path: string): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody
    return new ApiError(body)
  } catch {
    return new ApiError({
      timestamp: new Date().toISOString(),
      status: response.status,
      code: 'UNKNOWN_ERROR',
      message: response.statusText,
      path,
      request_id: '',
      field_errors: [],
    })
  }
}

async function rawFetch(path: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })
}

export interface ApiFetchOptions extends RequestInit {
  /** 이 요청 자체가 로그인·refresh 호출일 때 401 재시도 루프를 막기 위해 true로 둔다. */
  skipAuthRetry?: boolean
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipAuthRetry, ...init } = options

  let response: Response
  try {
    response = await rawFetch(path, init)
  } catch {
    throw networkApiError(path)
  }

  if (response.status === 401 && !skipAuthRetry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      try {
        response = await rawFetch(path, init)
      } catch {
        throw networkApiError(path)
      }
    } else {
      setAccessToken(null)
      authExpiredHandler?.()
      throw await parseErrorBody(response, path)
    }
  }

  if (!response.ok) {
    throw await parseErrorBody(response, path)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
