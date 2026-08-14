// Figma PROFILE-001(node 1615:2233) 데모 데이터 중 서버에 실제 값이 생긴 항목은 모두
// ProfilePage.tsx가 실 API(fowoco/server#168, #172)로 대체했다. 아래는 서버에 값 자체가
// 없는 나머지(업무 Context 요약 문구, 알림 유형별 라벨/설명 문구)만 화면 전용 상수로 남는다.

export const PROFILE_SUMMARY = {
  role: 'HR 담당자',
  email: 'hr.demo@fowoco.example',
  companyName: 'FOWOCO 데모 사업장',
}

export interface NotificationPreferenceCopy {
  label: string
  description: string
}

// key는 fowoco/server NotificationPreferenceKey와 맞춘다. 여기 없는 key가 서버에서 오면
// key 문자열을 그대로 보여준다(ProfilePage.tsx 참고).
export const NOTIFICATION_PREFERENCE_COPY: Record<string, NotificationPreferenceCopy> = {
  'security-permission': {
    label: '보안·권한 변경 알림',
    description: '비밀번호·세션·권한 변경 시 필수 안내',
  },
  'approval-request': {
    label: '승인 요청 도착',
    description: '내 승인이 필요한 업무',
  },
  'document-submitted': {
    label: '문서 제출 완료',
    description: '담당 근로자의 제출 완료',
  },
  'document-needs-fix': {
    label: '문서 보완 필요',
    description: '검토 후 보완이 필요한 문서',
  },
  'due-soon': {
    label: '마감 임박',
    description: '24시간 이내 마감 업무',
  },
  assigned: {
    label: '담당자 지정',
    description: '내게 새 업무가 배정됨',
  },
  'agent-ready': {
    label: 'Agent 분석 완료',
    description: '요청 분석 결과 준비됨',
  },
}
