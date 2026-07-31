// Figma PROFILE-001(node 1615:2233) 데모 데이터. 서버에 개인 프로필 API가 없어서
// (#191 조사 결과) 전부 고정값 — 수정은 화면 상태로만 반영되고 새로고침하면 초기화된다.

export const PROFILE_SUMMARY = {
  initial: '김',
  name: '김민지',
  role: 'HR 담당자',
  email: 'hr.demo@fowoco.example',
  companyName: 'FOWOCO 데모 사업장',
  lastLoginAt: '오늘 09:12',
  lastLoginDevice: 'Chrome · macOS · 서울',
}

export interface EditableProfileFields {
  name: string
  displayName: string
  phone: string
  preferredLanguage: string
  timezone: string
}

export const INITIAL_PROFILE_FIELDS: EditableProfileFields = {
  name: '김민지',
  displayName: '김민지 HR',
  phone: '010-0000-1234',
  preferredLanguage: '한국어',
  timezone: '(GMT+09:00) 서울',
}

export const WORK_CONTEXT = {
  companySummary: 'FOWOCO 데모 사업장 · HR 담당자 · 관리자 관리',
  canApprove: true,
  assignedArea: '체류·문서 운영',
  canRegisterData: false,
  documentScope: '담당 근로자',
}

export const SECURITY_INFO = {
  accountStatus: '정상',
  passwordChangedAt: '2026.07.01',
  loginDeviceSummary: '2대 · Chrome/macOS',
}

export interface ProfileNotificationPref {
  id: string
  label: string
  description: string
  enabled: boolean
}

export const INITIAL_NOTIFICATION_PREFS: ProfileNotificationPref[] = [
  { id: 'approval-request', label: '승인 요청 도착', description: '내 승인이 필요한 업무', enabled: true },
  { id: 'document-submitted', label: '문서 제출 완료', description: '담당 근로자의 제출 완료', enabled: true },
  { id: 'document-needs-fix', label: '문서 보완 필요', description: '검토 후 보완이 필요한 문서', enabled: true },
  { id: 'due-soon', label: '마감 임박', description: '24시간 이내 마감 업무', enabled: true },
  { id: 'assigned', label: '담당자 지정', description: '내게 새 업무가 배정됨', enabled: false },
  { id: 'agent-ready', label: 'Agent 분석 완료', description: '요청 분석 결과 준비됨', enabled: true },
]
