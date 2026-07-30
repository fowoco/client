export type PasswordStrengthTone = 'weak' | 'medium' | 'strong'

export interface PasswordStrength {
  score: 1 | 2 | 3
  label: string
  tone: PasswordStrengthTone
}

const TONE_BY_SCORE: Record<1 | 2 | 3, PasswordStrengthTone> = {
  1: 'weak',
  2: 'medium',
  3: 'strong',
}

const LABEL_BY_SCORE: Record<1 | 2 | 3, string> = {
  1: '약함',
  2: '보통',
  3: '안전',
}

export function getPasswordStrength(password: string): PasswordStrength | null {
  if (password.length === 0) return null

  let score = 0
  if (password.length >= 8) score += 1
  if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) score += 1
  if (password.length >= 12 || /[^a-zA-Z0-9]/.test(password)) score += 1

  const clamped = Math.max(1, Math.min(3, score)) as 1 | 2 | 3
  return { score: clamped, label: LABEL_BY_SCORE[clamped], tone: TONE_BY_SCORE[clamped] }
}
