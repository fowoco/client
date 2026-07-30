// 실제 알림 API가 없어서(server에 알림 도메인 미구현) 데모 데이터로 대신한다.
export interface HeaderNotification {
  id: string
  title: string
  time: string
  read: boolean
}

export const HEADER_NOTIFICATIONS: HeaderNotification[] = [
  { id: 'n1', title: '응웬반A 체류연장 요청문 승인이 필요합니다.', time: '10분 전', read: false },
  { id: 'n2', title: '외국인등록증 사본 제출 기한이 오늘까지입니다.', time: '1시간 전', read: false },
  { id: 'n3', title: '쩐티B 서류 검토가 완료됐습니다.', time: '어제', read: true },
]
