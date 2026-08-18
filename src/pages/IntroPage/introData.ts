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

export type HeroHighlightIconKey = 'globe' | 'person' | 'lock'

export interface HeroHighlight {
  icon: HeroHighlightIconKey
  label: string
}

export const HERO_HIGHLIGHTS: HeroHighlight[] = [
  { icon: 'globe', label: 'E-9 체류·계약·문서를 한 곳에서' },
  { icon: 'person', label: 'Agent는 초안까지, 결정은 사람이' },
  { icon: 'lock', label: '전달·제출은 담당자가 직접 수행' },
]

export type FeatureIconKey = 'agent' | 'calendar' | 'contract' | 'folder' | 'globe' | 'radar'

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

// FOWOCO_Intent·Domain·Slot 학습가이드의 처리 파이프라인(Intent → Domain → Slot →
// Workflow Resolver → Case/Task)를 그대로 반영한 6단계.
export const STEPS: Step[] = [
  { no: '01', title: '자연어 요청', description: '"응웬반A 체류연장 준비해줘"처럼 편하게 요청' },
  {
    no: '02',
    title: 'Intent·Domain 분류',
    description: '무슨 일을, 어느 업무 영역에서 하려는지 파악',
  },
  { no: '03', title: 'Slot 추출·검증', description: '근로자·날짜·서류 등 실행에 필요한 값 확인' },
  { no: '04', title: 'Case·Task 생성', description: '새 Case와 실행할 업무 단계로 연결' },
  { no: '05', title: '담당자 검토·승인', description: '근거를 확인하고 최종 결정' },
  { no: '06', title: '직접 실행·기록', description: '전달·제출은 사람이, 결과는 Case에 기록' },
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

export type WorkflowIconKey =
  'contract' | 'workerAdd' | 'exit' | 'folder' | 'payroll' | 'instruction'

export interface Workflow {
  icon: WorkflowIconKey
  kind: 'Master' | 'Reusable'
  title: string
  description: string
}

// FOWOCO_6대 Workflow 실행설계서 기준 — Master Workflow 3종 + Reusable Workflow 3종.
export const WORKFLOWS: Workflow[] = [
  {
    icon: 'contract',
    kind: 'Master',
    title: '재계약·연장',
    description:
      '계약·고용허가·취업활동·체류기간, 4개의 만료일을 각각 확인해 하나의 Case로 관리합니다.',
  },
  {
    icon: 'workerAdd',
    kind: 'Master',
    title: '신규등록',
    description:
      '여권·외국인등록증·계약서를 분석해 근로자 프로필 초안을 만들고 초기 업무를 생성합니다.',
  },
  {
    icon: 'exit',
    kind: 'Master',
    title: '퇴사·고용변동',
    description:
      '사건 유형과 기준일을 확정하면 신고기한 후보를 계산하고 처리 결과를 Case에 남깁니다.',
  },
  {
    icon: 'folder',
    kind: 'Reusable',
    title: '서류 요청',
    description: '정확한 서류명·기한·제출처를 구조화해 근로자에게 요청하고 제출까지 추적합니다.',
  },
  {
    icon: 'payroll',
    kind: 'Reusable',
    title: '급여명세서 차이 설명',
    description: '이전 명세서와 근태 근거를 비교해 항목별 차이를 계산하고 원인을 설명합니다.',
  },
  {
    icon: 'instruction',
    kind: 'Reusable',
    title: '업무·근무일정 안내',
    description:
      '모호한 지시를 날짜·장소·수량이 분명한 문장으로 바꿔 쉬운 한국어와 모국어로 전달합니다.',
  },
]

export interface IntroSection {
  id: string
  label: string
}

export const INTRO_SECTIONS: IntroSection[] = [
  { id: 'hero', label: '소개' },
  { id: 'features', label: '핵심 기능' },
  { id: 'workflows', label: '6대 Workflow' },
  { id: 'steps', label: '진행 방식' },
  { id: 'trust', label: '신뢰 원칙' },
  { id: 'footer', label: '푸터' },
]
