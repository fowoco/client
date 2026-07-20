import { create } from 'zustand'

// TODO(backend): 데모 계정. POST /api/auth/login 연동 후 하드코딩 제거
export const DEMO_ACCOUNT = {
  email: 'mini@naver.com',
  password: '1234',
  name: '김경민',
  workplace: '한빛정밀',
  role: 'HR',
}

export interface AuthUser {
  name: string
  workplace: string
  role: string
}

interface AuthState {
  user: AuthUser | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (email, password) => {
    // TODO(backend): POST /api/auth/login { email, password } -> 세션/토큰 저장
    if (email === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
      set({
        user: {
          name: DEMO_ACCOUNT.name,
          workplace: DEMO_ACCOUNT.workplace,
          role: DEMO_ACCOUNT.role,
        },
      })
      return true
    }
    return false
  },
  logout: () => {
    // TODO(backend): POST /api/auth/logout -> 세션 종료
    set({ user: null })
  },
}))
