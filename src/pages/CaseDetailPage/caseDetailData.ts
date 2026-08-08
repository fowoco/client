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
