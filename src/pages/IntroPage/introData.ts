export interface AgentPreviewItem {
  icon: '✓' | '!' | '→'
  label: string
  tag: string
}

export const AGENT_PREVIEW_ITEMS: AgentPreviewItem[] = [
  { icon: '✓', label: '근로자와 체류만료일 확인', tag: '보유 데이터' },
  { icon: '✓', label: '등록된 처리 절차 확인', tag: '등록된 규칙' },
  { icon: '!', label: '여권 사본 누락 감지', tag: 'HR 확인' },
  { icon: '→', label: '요청문 초안 준비', tag: 'Agent 초안' },
]

export interface PreviewMetric {
  label: string
  value: string
}

export const PREVIEW_METRICS: PreviewMetric[] = [
  { label: '승인 대기', value: '2' },
  { label: '오늘 업무', value: '6' },
  { label: '기한 위험', value: '1' },
  { label: '오늘 완료', value: '8' },
]

export type FeatureIconKey =
  | 'agent'
  | 'calendar'
  | 'contract'
  | 'folder'
  | 'globe'
  | 'radar'

export interface Feature {
  icon: FeatureIconKey
  title: string
  description: string
}

export const FEATURES: Feature[] = [
  {
    icon: 'agent',
    title: '업무 준비 Agent',
    description: '자연어와 파일에서 요청을 이해하고 업무 초안을 준비합니다.',
  },
  {
    icon: 'calendar',
    title: '체류 기한 관리',
    description: '만료일과 필요서류를 확인해 우선 업무를 알려줍니다.',
  },
  {
    icon: 'contract',
    title: '계약 업무 관리',
    description: '갱신과 확인 일정을 업무 흐름에 맞게 연결합니다.',
  },
  {
    icon: 'folder',
    title: '문서 준비 상태',
    description: '필요·보유·누락·만료 문서를 비교합니다.',
  },
  {
    icon: 'globe',
    title: '다국어 안내 초안',
    description: '보유 자료를 바탕으로 근로자 안내문을 준비합니다.',
  },
  {
    icon: 'radar',
    title: '기한·누락 감지',
    description: '지연 가능성과 부족한 정보를 찾아 먼저 알립니다.',
  },
]

export interface Step {
  no: string
  title: string
  description: string
}

export const STEPS: Step[] = [
  { no: '01', title: '요청 입력', description: '자연어 또는 파일' },
  { no: '02', title: 'Agent 분석', description: '필수정보와 규칙 확인' },
  { no: '03', title: '담당자 검토·승인', description: '근거 확인과 결정' },
  { no: '04', title: '직접 실행·기록', description: '전달·제출·증빙 기록' },
]

export type TrustIconKey = 'person' | 'shield' | 'lock' | 'audit'

export interface TrustItem {
  icon: TrustIconKey
  title: string
  description: string
}

export const TRUST_ITEMS: TrustItem[] = [
  {
    icon: 'person',
    title: '사람의 최종 결정',
    description: 'Agent는 분석·추천·초안 작성까지만 수행합니다.',
  },
  {
    icon: 'shield',
    title: '안전한 실행 경계',
    description: '외부 전달과 기관 제출은 담당자가 직접 수행합니다.',
  },
  {
    icon: 'lock',
    title: '개인정보 보호',
    description: '업무에 필요한 범위와 보관 정책을 지킵니다.',
  },
  {
    icon: 'audit',
    title: '근거와 감사 기록',
    description: '승인·변경·재발급·완료 이력을 확인합니다.',
  },
]

export interface IntroSection {
  id: string
  label: string
}

export const INTRO_SECTIONS: IntroSection[] = [
  { id: 'hero', label: '소개' },
  { id: 'features', label: '핵심 기능' },
  { id: 'steps', label: '진행 방식' },
  { id: 'trust', label: '신뢰 원칙' },
  { id: 'footer', label: '푸터' },
]
