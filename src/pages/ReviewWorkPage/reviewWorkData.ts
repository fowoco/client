export interface ReviewStep {
  no: string
  label: string
}

// CreateWorkPage(1.요청 확인)와 ReviewWorkPage(AI Run 분석 결과) 진행 표시기가 함께 쓰는 단계 라벨.
export const REVIEW_STEPS: ReviewStep[] = [
  { no: '1', label: '요청 확인' },
  { no: '2', label: '분석 결과' },
]
