import { create } from 'zustand'
import { apiFetch, setAccessToken, setAuthExpiredHandler } from '../api/client'
import { ApiError, getErrorMessage } from '../api/errors'

// 로그인 화면·도움말에 안내하는 데모 계정.
// TODO(backend): 이 계정이 fowoco/server DB에 실제로 seed돼 있는지 백엔드팀 확인 필요 (#101).
// 없으면 여기 값을 실제 seed 계정으로 교체해야 한다.
export const DEMO_ACCOUNT = {
  email: 'mini@naver.com',
  password: '1234',
}

export interface AuthUser {
  name: string
  workplace: string
  role: string
}

export type AuthStatus = 'idle' | 'restoring' | 'ready'

interface LoginRequestBody {
  email: string
  password: string
}

// fowoco/server LoginResponse (POST /api/v1/auth/login) 그대로.
interface LoginResponseBody {
  user_id: string
  company_id: string
  company_name: string
  role: string
  access_token: string
  token_type: string
  expires_in_seconds: number
  expires_at: string
}

// fowoco/server RefreshResponse (POST /api/v1/auth/refresh) 그대로.
interface RefreshResponseBody {
  access_token: string
  token_type: string
  expires_in_seconds: number
  expires_at: string
}

// fowoco/server CurrentActorResponse (GET /api/v1/auth/me) 그대로.
interface CurrentActorResponseBody {
  user_id: string
  company_id: string
  roles: string[]
}

// company_name과 화면 표시용 이름 -- GET /auth/me는 user_id/company_id/roles만 내려주고
// 표시용 이름이나 사업장명을 주지 않는다. 로그인 시 한 번 받은 값을 여기 저장해뒀다가
// 새로고침 세션 복원(restoreSession) 때 재사용한다. 민감정보가 아니라 localStorage에 둬도
// 안전하다. 서버가 /auth/me에 company_name·표시용 이름을 추가해주면 이 저장소는 제거하고
// 매번 서버 값을 그대로 쓰면 된다.
const PROFILE_STORAGE_KEY = 'fowoco.auth.profile'

interface PersistedProfile {
  name: string
  workplace: string
}

function persistProfile(profile: PersistedProfile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // 프라이빗 모드 등으로 localStorage를 못 쓰더라도 로그인 자체는 계속 진행한다.
  }
}

function readPersistedProfile(): PersistedProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedProfile) : null
  } catch {
    return null
  }
}

function clearPersistedProfile() {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY)
  } catch {
    // noop
  }
}

interface AuthState {
  user: AuthUser | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  /** 새로고침 직후 등, Refresh Token 쿠키로 세션을 조용히 복원해본다. RequireAuth가 호출한다. */
  restoreSession: () => Promise<void>
}

function toApiErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? getErrorMessage(error) : fallback
}

export const useAuthStore = create<AuthState>((set) => {
  // client.ts는 이 스토어를 모르는 채로 동작하므로(순환 참조 방지), refresh 재시도까지
  // 실패했을 때 로그아웃 처리를 여기서 콜백으로 연결해준다.
  setAuthExpiredHandler(() => {
    setAccessToken(null)
    clearPersistedProfile()
    set({ user: null, status: 'ready' })
  })

  return {
    user: null,
    status: 'idle',

    login: async (email, password) => {
      try {
        const body = await apiFetch<LoginResponseBody>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password } satisfies LoginRequestBody),
          // 로그인 자체가 401(INVALID_CREDENTIALS)을 반환해도 refresh를 시도하면 안 된다.
          skipAuthRetry: true,
        })

        setAccessToken(body.access_token)
        const profile: PersistedProfile = { name: email.split('@')[0], workplace: body.company_name }
        persistProfile(profile)
        set({ user: { ...profile, role: body.role }, status: 'ready' })
        return { success: true }
      } catch (error) {
        return { success: false, message: toApiErrorMessage(error, '알 수 없는 오류가 발생했습니다.') }
      }
    },

    logout: async () => {
      try {
        await apiFetch('/auth/logout', { method: 'POST', skipAuthRetry: true })
      } catch {
        // 서버가 폐기를 보장 못 해도(ADR-0002) 클라이언트는 사용자를 로그인 화면으로 보낸다.
      }
      setAccessToken(null)
      clearPersistedProfile()
      set({ user: null, status: 'ready' })
    },

    restoreSession: async () => {
      set({ status: 'restoring' })
      try {
        const refreshBody = await apiFetch<RefreshResponseBody>('/auth/refresh', {
          method: 'POST',
          skipAuthRetry: true,
        })
        setAccessToken(refreshBody.access_token)

        const me = await apiFetch<CurrentActorResponseBody>('/auth/me')
        const persisted = readPersistedProfile()
        set({
          user: {
            name: persisted?.name ?? '사용자',
            workplace: persisted?.workplace ?? '',
            role: me.roles[0] ?? '',
          },
          status: 'ready',
        })
      } catch {
        // 쿠키가 없거나 만료됐으면 로그인 화면으로 보내는 게 정상 흐름이라 에러로 취급하지 않는다.
        setAccessToken(null)
        clearPersistedProfile()
        set({ user: null, status: 'ready' })
      }
    },
  }
})
