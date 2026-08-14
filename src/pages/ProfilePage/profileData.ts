// Figma PROFILE-001(node 1615:2233) 데모 데이터. 표시 이름·연락처는 fowoco/server#168로
// 실제 API(GET/PATCH /api/v1/auth/me/profile)가 생겨서 ProfilePage.tsx가 이 파일 대신
// 서버 값을 쓴다. 아래는 서버에 없는 나머지(업무 Context, 알림, 보안 요약)만 데모로 남는다.

export const PROFILE_SUMMARY = {
  role: 'HR 담당자',
  email: 'hr.demo@fowoco.example',
  companyName: 'FOWOCO 데모 사업장',
  lastLoginAt: '오늘 09:12',
  lastLoginDevice: 'Chrome · macOS · 서울',
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
  /** 강제 필수 알림 — 토글 비활성화, 항상 켜짐. Figma Profile Security Boundary(#212) 기준. */
  required?: boolean
}

export const INITIAL_NOTIFICATION_PREFS: ProfileNotificationPref[] = [
  {
    id: 'security-permission',
    label: '보안·권한 변경 알림',
    description: '비밀번호·세션·권한 변경 시 필수 안내',
    enabled: true,
    required: true,
  },
  {
    id: 'approval-request',
    label: '승인 요청 도착',
    description: '내 승인이 필요한 업무',
    enabled: true,
  },
  {
    id: 'document-submitted',
    label: '문서 제출 완료',
    description: '담당 근로자의 제출 완료',
    enabled: true,
  },
  {
    id: 'document-needs-fix',
    label: '문서 보완 필요',
    description: '검토 후 보완이 필요한 문서',
    enabled: true,
  },
  { id: 'due-soon', label: '마감 임박', description: '24시간 이내 마감 업무', enabled: true },
  { id: 'assigned', label: '담당자 지정', description: '내게 새 업무가 배정됨', enabled: false },
  {
    id: 'agent-ready',
    label: 'Agent 분석 완료',
    description: '요청 분석 결과 준비됨',
    enabled: true,
  },
]
