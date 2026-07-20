// TODO(backend): GET /api/links/:token -> 아래 상수 대체 (만료 시 LinkExpiredPage로 라우팅)

export const LINK_REQUEST = {
  expiryNotice: {
    title: '이 링크는 72시간 동안 유효합니다.',
    body: '만료 전 필요한 작업을 완료해 주세요.',
  },
  requester: '한빛정밀 인사팀 요청',
  headline: ['여권 사본을', '제출해 주세요'],
  deadline: '마감 · 7월 24일 수요일',
  body: '체류연장 준비를 위해 여권의 사진이 있는 면을 제출해 주세요. 촬영한 이미지가 흐리지 않은지 확인해 주세요.',
  privacy: {
    title: '이 화면에는 이 업무에 필요한 정보만 표시됩니다.',
    body: '제출 파일은 회사 HR 담당자가 확인합니다.',
  },
  footnote: '안내를 읽은 것과 서류 제출 완료는 별도로 기록됩니다.',
}
