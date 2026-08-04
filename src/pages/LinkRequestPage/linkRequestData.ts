// TODO(backend): GET /api/links/:token -> 아래 상수 대체 (만료 시 LinkExpiredPage로 라우팅)

export const LINK_REQUEST = {
  expiryNotice: {
    title: '데모 화면입니다.',
    body: '실제 보안 링크 유효시간은 토큰 조회 API 연결 후 표시됩니다.',
  },
  requester: '보안 링크 요청 정보',
  headline: ['서류 제출 안내를', '확인해 주세요'],
  deadline: '마감 · 링크 API 연결 후 표시',
  body: '실제 요청 서류와 안내 문구는 보안 링크 토큰을 조회한 뒤 표시됩니다.',
  privacy: {
    title: '이 화면에는 이 업무에 필요한 정보만 표시됩니다.',
    body: '파일은 실제 업로드 API가 연결된 뒤에만 제출됩니다.',
  },
  footnote: '현재는 화면 확인만 가능하며 읽음·제출 상태를 기록하지 않습니다.',
}
