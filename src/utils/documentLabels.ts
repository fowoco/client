import type { StatusTone } from '../components/ui/StatusLabel/StatusLabel'
import type { DocumentItemResponse, DocumentType, SubmissionStatus } from '../api/documents'
import { daysUntil } from './urgency'

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  PASSPORT_COPY: '여권 사본',
  ARC: '외국인등록증',
  CONTRACT: '근로계약서',
  PERMIT: '고용허가서',
}

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  MISSING: '미제출',
  SUBMITTED: '확인 대기',
  VERIFIED: '확인 완료',
}

export const SUBMISSION_STATUS_TONE: Record<SubmissionStatus, StatusTone> = {
  MISSING: 'critical',
  SUBMITTED: 'warning',
  VERIFIED: 'success',
}

// Figma DOC-001(node 1499:1256) 기준 상태별 다음 행동 문구. "증빙 연결"(완료 증빙 유형 전용)은
// 서버 DocumentType에 대응 값이 없어 별도 처리가 필요해 여기 포함하지 않는다 (#219).
export function getDocumentReviewAction(document: DocumentItemResponse): string {
  if (document.submission_status === 'MISSING') return '요청 초안'
  const expiryDays = daysUntil(document.expiry_date)
  if (expiryDays !== null && expiryDays < 0) return '교체 요청'
  if (document.submission_status === 'VERIFIED') return '보기'
  return '확인하기 →'
}
