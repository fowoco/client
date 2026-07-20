// TODO(backend): GET /api/procedures -> '처리 절차' 모드의 등록된 절차 목록
// TODO(backend): GET /api/work-items?recent=true -> '이전 업무' 모드의 최근 업무 목록

export const INPUT_MODES = [
  { id: 'nl', label: '자연어 요청', description: '직접 설명' },
  { id: 'file', label: '파일 가져오기', description: 'Excel · PDF · 이미지' },
  { id: 'procedure', label: '처리 절차', description: '등록된 절차에서 선택' },
  { id: 'previous', label: '이전 업무', description: '기존 업무 복사' },
] as const

export type InputModeId = (typeof INPUT_MODES)[number]['id']

export const EXAMPLE_PROMPTS = ['체류연장 준비', '입사자료 취합', '외부기관 제출', '근태자료 설명']

export const MAX_LENGTH = 2000

export const AGENT_TRACE_PREVIEW = {
  title: '분석하면 이렇게 준비합니다',
  steps: '요청 분해  →  대상·기한 확인  →  등록된 처리 절차 연결  →  업무 초안 준비',
  disclaimer: 'Agent는 초안을 준비하며 승인·외부 발송·정부기관 제출을 실행하지 않습니다.',
}
