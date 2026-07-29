export interface OnboardingStep {
  title: string
  body: string
}

// Figma 최신 페이지(PWF)에서 이 온보딩 투어 노드를 찾지 못해(API가 구버전 MFW 페이지만
// 반환함), 다른 자체 설계 화면(#55/#56/#57)과 같은 톤으로 새로 구성했다.
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'FOWOCO에 오신 것을 환영합니다',
    body: 'E-9 근로자 HR 업무를 Agent와 함께 처리합니다. Agent는 초안을 준비할 뿐, 승인·발송·정부기관 제출은 항상 담당자가 직접 실행합니다.',
  },
  {
    title: 'Today·업무함에서 우선순위를 확인하세요',
    body: '체류·서류 기한이 임박한 근로자와 업무를 먼저 보여드립니다. 급한 것부터 처리하면 됩니다.',
  },
  {
    title: '무엇이든 요청하면 Agent가 초안을 준비합니다',
    body: '"업무 만들기"에서 한 문장으로 요청하거나 근로자·처리 절차를 직접 골라 업무를 만들 수 있습니다. 승인 전에는 근로자에게 아무것도 전달되지 않습니다.',
  },
]
