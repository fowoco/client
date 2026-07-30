export type StartMode = 'migrate' | 'manual' | 'later'

export interface StartOption {
  id: StartMode
  title: string
  description: string
}

export const START_OPTIONS: StartOption[] = [
  {
    id: 'migrate',
    title: '기존 데이터 이전',
    description: '엑셀·문서 파일로 근로자 명단을 한 번에 가져옵니다.',
  },
  {
    id: 'manual',
    title: '직접 입력',
    description: '근로자를 하나씩 직접 등록합니다.',
  },
  {
    id: 'later',
    title: '나중에 설정',
    description: '지금은 건너뛰고 바로 대시보드로 이동합니다.',
  },
]

export const SUPPORTED_FORMATS = ['XLSX', 'CSV', 'PDF', 'JPG', 'PNG', 'HWP', 'HWPX', 'DOCX']

export const ANALYSIS_STAGES = ['원본 확인', '보안 검사', '변환·파싱', '근로자 연결', '값 검증']

export type ReviewStatus = 'ready' | 'needs-info' | 'duplicate' | 'doc-type'

export interface ReviewCandidate {
  id: string
  name: string
  detail: string
  status: ReviewStatus
}

export const INITIAL_REVIEW_CANDIDATES: ReviewCandidate[] = [
  { id: 'c1', name: '응웬반A', detail: '베트남 · E-9 · 여권 M1234****', status: 'ready' },
  { id: 'c2', name: '쩐티B', detail: '체류만료일 값이 비어 있습니다.', status: 'needs-info' },
  { id: 'c3', name: '수라즈C', detail: '기존 근로자와 이름·여권번호가 유사합니다.', status: 'duplicate' },
  { id: 'c4', name: '아흐메드D', detail: '근로계약서 문서 유형을 확인해 주세요.', status: 'doc-type' },
]

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  ready: '등록 준비 완료',
  'needs-info': '필수정보 확인',
  duplicate: '중복 후보',
  'doc-type': '문서 유형 확인',
}
