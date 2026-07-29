import type { StatusTone } from '../components/ui/StatusLabel/StatusLabel'
import type { DocumentType, SubmissionStatus } from '../api/documents'

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
