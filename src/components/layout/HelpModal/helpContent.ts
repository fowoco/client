export interface HelpFaqItem {
  question: string
  answer: string
}

export const HELP_FAQ: HelpFaqItem[] = [
  {
    question: '업무는 어떻게 시작하나요?',
    answer:
      '상단 "＋ 업무 만들기"에서 요청을 입력하면 Agent가 이해한 내용을 정리해 보여줍니다. 확인이 필요한 정보를 채운 뒤 업무를 생성하세요.',
  },
  {
    question: '승인은 누가 할 수 있나요?',
    answer: '설정 > 구성원과 승인 권한에서 지정된 구성원만 승인할 수 있습니다. Agent는 승인자가 될 수 없습니다.',
  },
  {
    question: '근로자 서류는 어디서 확인하나요?',
    answer: '서류 메뉴에서 근로자별 제출 현황을 상태별(미제출/확인 대기/확인 완료)로 확인할 수 있습니다.',
  },
  {
    question: '근로자가 남긴 질문은 어디서 답하나요?',
    answer: '티켓 메뉴에서 근로자 모바일로 들어온 질문·이슈를 신규/응답 대기/완료 탭으로 확인하고 답변합니다.',
  },
]

export const HELP_FLOWS = [
  '업무 만들기 → Agent가 이해한 요청 확인 → 정보 입력 → 업무 생성',
  '업무 상세 → 처리 단계 확인 → 승인 요청 → 완료 처리',
  '근로자 목록 → 기한·서류 확인 → 관련 업무로 이동',
]
