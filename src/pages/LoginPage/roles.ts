export const LOGIN_ROLES = ['관리자', 'HR', '현장관리자'] as const

export type LoginRole = (typeof LOGIN_ROLES)[number]
