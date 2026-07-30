// 최초 회원가입 후 첫 로그인에서만 온보딩 데이터 가져오기 위저드로 보내기 위한 플래그.
// 위저드를 완료하거나 건너뛰면 지워지고, 그 다음부터는 로그인하면 바로 대시보드로 간다.
const STORAGE_KEY = 'fowoco.onboarding.import.pending'

export function isOnboardingImportPending(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function markOnboardingImportPending() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch {
    // 프라이빗 모드 등으로 localStorage를 못 쓰면 온보딩 위저드 없이 바로 대시보드로 간다.
  }
}

export function clearOnboardingImportPending() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // no-op
  }
}
