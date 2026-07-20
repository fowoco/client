// TODO(backend): GET /api/settings -> SETTINGS_TABS 이하 상수 대체
// TODO(backend): PATCH /api/settings/members/:id { canApprove } -> 멤버 토글 반영

export const SETTINGS_TABS = ['구성원·승인 권한', '보안 링크', '완료 증빙', '처리 절차', '데이터·AI 로그']

export const APPROVAL_POLICY = {
  badge: 'MVP 기본값',
  title: '지정 승인자 1인 또는 승인자 그룹',
  description: '그룹에서는 구성원 중 1명이 먼저 승인하거나 반려하면 최종 결과가 됩니다.',
  mode: 'ANY_ONE',
  modeNote: '순차·전원 승인 미지원',
  warning: 'Agent는 승인자가 될 수 없습니다.',
}

export const POLICY_SUMMARY = {
  title: '주요 운영 기본값',
  rows: [
    { label: '보안 링크', value: '72시간', tone: 'default' as const },
    { label: '일반 내부업무', value: '파일 첨부 불필요', tone: 'default' as const },
    { label: '외부기관 업무', value: '증빙 1개 이상', tone: 'warning' as const },
    { label: 'AI 원문 로그', value: '30일 후 삭제·비식별화', tone: 'warning' as const },
    { label: '비식별 품질 로그', value: '12개월', tone: 'default' as const },
  ],
}

export type MemberApproval = 'canApprove' | 'requestOnly'
export type MemberStatus = '활성' | '초대 중'

export interface Member {
  id: string
  name: string
  role: string
  approval: MemberApproval
  status: MemberStatus
}

export const MEMBERS: Member[] = [
  { id: 'M-1', name: '이수진', role: 'OWNER', approval: 'canApprove', status: '활성' },
  { id: 'M-2', name: '박서준', role: 'HR_MANAGER', approval: 'canApprove', status: '활성' },
  { id: 'M-3', name: '김경민', role: 'HR_STAFF', approval: 'requestOnly', status: '활성' },
  { id: 'M-4', name: '정하늘', role: 'HR_STAFF', approval: 'requestOnly', status: '초대 중' },
]

export const FOOTNOTE =
  'MVP 운영정책은 출시 전 개인정보·노무·법률 검토가 필요합니다. 일반 HR 사용자는 보관기간을 무기한으로 변경할 수 없습니다.'
