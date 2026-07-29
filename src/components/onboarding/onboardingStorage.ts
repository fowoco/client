const STORAGE_KEY = 'fowoco.onboarding.completed'

export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return true
  }
}

export function markOnboardingCompleted() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch {
    // 프라이빗 모드 등으로 localStorage를 못 쓰면 매번 다시 뜨는 정도로 감수한다.
  }
}
