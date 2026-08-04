// TODO(backend): GET /api/work-items/:id -> 아래 상수 전체 대체
// 제목·상태·체크리스트는 #153에서 실제 Task API로 대체됐다 (CaseDetailPage.tsx 참고).

export const CASE_TABS = ['현재 단계', '체크리스트', '문서', '소통', '활동이력']

export const AGENT_SUMMARY = {
  headline: '여권 사본 요청문을 준비했습니다.',
  body: '승인이 완료되면 72시간 보안 링크가 활성화됩니다. 실제 전달은 HR이 직접 수행합니다.',
  actionLabel: '다음 행동 · 승인 요청',
}

export const CONTEXT_ACCESS = {
  label: '관련 Context',
  rows: [
    { label: '근거', value: 4 },
    { label: '문서', value: 3 },
    { label: '활동', value: 8 },
  ],
}

export const CONTEXT_DRAWER = {
  agentConfirmed: [
    '응웬반A의 체류만료일이 2026-08-03로 확인됨',
    '보유 서류 중 여권 사본, 표준근로계약서는 최신 상태',
  ],
  missingInfo: ['출입국 접수번호 미입력', '근로자 서명 확인 대기'],
  officialSources: [
    { label: '하이코리아 체류자격 안내', value: '2026-07-18 확인' },
    { label: '출입국·외국인정책본부 고시', value: '2026-07-10 확인' },
  ],
  hrTodo: ['근로자 안내문 최종 검토 후 승인 요청', '보안 링크 전달 전 담당자 직접 확인'],
}

export interface CaseCommunicationEntry {
  id: string
  time: string
  actor: string
  message: string
}

export const CASE_COMMUNICATION: CaseCommunicationEntry[] = [
  { id: 'comm-1', time: '오늘 09:12', actor: 'Agent', message: '여권 사본 요청문 초안을 준비했습니다.' },
  { id: 'comm-2', time: '어제 17:40', actor: '김경민', message: '근로자에게 서류 제출 안내 문자를 발송했습니다.' },
  { id: 'comm-3', time: '어제 09:05', actor: '응웬반A', message: '서류를 준비 중이라고 답장했습니다.' },
]

// 승인 플로우 오버레이 5종 데모 데이터 (Figma "05_States & Overlays" 기준)
export const OTHER_APPROVER_HANDLED = {
  policyNote: 'ANY_ONE · 먼저 처리된 결과가 최종입니다.',
  rows: [
    { label: '승인 요청일', value: '2026.07.20 10:14' },
    { label: '지정 승인자', value: '김수진 · 박지훈' },
    { label: '처리자', value: '김수진 HR_MANAGER' },
    { label: '처리일', value: '2026.07.20 10:22' },
    { label: '처리 결과', value: '승인됨' },
    { label: '사유', value: '필수서류와 마감일 확인' },
  ],
}

export const APPROVAL_SNAPSHOT_DIFF = {
  warningNote: '승인된 핵심 내용이 변경되어 재승인이 필요합니다.',
  rows: [
    { field: '마감일', before: '2026.07.24', after: '2026.07.25', result: '재승인' as const },
    { field: '요청 서류', before: '여권 사본', after: '여권·등록증 사본', result: '재승인' as const },
    { field: '안내문 본문', before: 'V1 승인 문구', after: '마감일 안내 추가', result: '재승인' as const },
    { field: '내부 메모', before: '초안 확인', after: '전화 확인 완료', result: '승인 유지' as const },
  ],
}
