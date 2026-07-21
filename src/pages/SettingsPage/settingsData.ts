import type { DetailRowTone } from '../../components/ui/DetailRow/DetailRow'

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

export const SECURITY_LINK_POLICY = {
  title: '근로자 업로드 링크 만료 정책',
  validity: '72시간',
  description: 'LINK-001/002에서 발급되는 보안 링크는 발급 후 72시간이 지나면 자동 만료됩니다.',
}

export type SecurityLinkStatus = '사용 완료' | '만료' | '대기 중'

export interface SecurityLinkHistoryEntry {
  id: string
  workerName: string
  issuedAt: string
  status: SecurityLinkStatus
}

export const SECURITY_LINK_HISTORY: SecurityLinkHistoryEntry[] = [
  { id: 'LNK-1', workerName: '응웬반A', issuedAt: '07.19 14:02', status: '사용 완료' },
  { id: 'LNK-2', workerName: '쩐티B', issuedAt: '07.18 09:40', status: '만료' },
  { id: 'LNK-3', workerName: '수라즈C', issuedAt: '07.20 08:15', status: '대기 중' },
]

export interface CompletionEvidenceRule {
  caseType: string
  requirement: string
  tone: DetailRowTone
}

export const COMPLETION_EVIDENCE_RULES: CompletionEvidenceRule[] = [
  { caseType: '일반 내부업무', requirement: '파일 첨부 불필요', tone: 'default' },
  { caseType: '외부기관 업무', requirement: '증빙 1개 이상', tone: 'warning' },
  { caseType: '체류·비자 업무', requirement: '접수번호 필수', tone: 'warning' },
]

export interface ProcessStepRule {
  caseType: string
  approvalSteps: string
}

export const PROCESS_STEP_RULES: ProcessStepRule[] = [
  { caseType: '일반 내부업무', approvalSteps: '담당자 1인 승인' },
  { caseType: '외부기관 업무', approvalSteps: '담당자 승인 + 증빙 확인' },
  { caseType: '체류·비자 업무', approvalSteps: 'HR 승인 + 접수번호 확인' },
]

export interface DataLogSetting {
  label: string
  value: string
  tone: DetailRowTone
}

export const DATA_LOG_SETTINGS: DataLogSetting[] = [
  { label: 'Agent 접근 범위', value: '근로자 기본정보·업무 컨텍스트', tone: 'default' },
  { label: 'AI 원문 로그', value: '30일 후 삭제·비식별화', tone: 'warning' },
  { label: '비식별 품질 로그', value: '12개월 보관', tone: 'default' },
]
