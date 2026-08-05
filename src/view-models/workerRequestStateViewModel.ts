export type WorkerRequestState = 'DOCUMENT_WAITING' | 'REQUEST_SENT' | 'APPROVAL_WAITING' | 'COMPLETED'

export interface WorkerRequestStateSource {
  requestSentAt?: string | null
  responseReceivedAt?: string | null
  responseReadAt?: string | null
  completedAt?: string | null
}

export interface WorkerRequestStateViewModel {
  state: WorkerRequestState
  label: '서류대기' | '요청전송' | '승인대기' | '완료'
  description: string
}

export function getWorkerRequestStateViewModel(
  source: WorkerRequestStateSource,
): WorkerRequestStateViewModel {
  if (source.completedAt) {
    return { state: 'COMPLETED', label: '완료', description: '서류 확인과 후속 처리가 완료되었습니다.' }
  }
  if (source.responseReceivedAt && !source.responseReadAt) {
    return { state: 'APPROVAL_WAITING', label: '승인대기', description: '근로자 응답이 도착해 담당자 확인이 필요합니다.' }
  }
  if (source.requestSentAt) {
    return { state: 'REQUEST_SENT', label: '요청전송', description: '요청을 전송했으며 근로자 응답을 기다립니다.' }
  }
  return {
    state: 'DOCUMENT_WAITING',
    label: '서류대기',
    description: '요청 정보는 등록됐지만 모바일 링크 전송은 확인되지 않았습니다.',
  }
}
