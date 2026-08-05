import type { DocumentItemResponse } from '../api/documents'
import type { StatusTone } from '../components/ui/StatusLabel/StatusLabel'
import { DOCUMENT_TYPE_LABEL } from '../utils/documentLabels'
import { getOperationalDateViewModel, type OperationalDateViewModel } from './dateViewModel'

export type DocumentWorkflowState = 'NOT_SUBMITTED' | 'REVIEW_REQUIRED' | 'COMPLETED' | 'EXPIRED'

export interface DocumentViewModel {
  id: string
  workerId: string
  workerName: string
  typeLabel: string
  workflowState: DocumentWorkflowState
  statusLabel: string
  statusTone: StatusTone
  expiry: OperationalDateViewModel
  fileAvailable: boolean
  fileLabel: string
  actionLabel: string
  reviewable: boolean
}

export function getDocumentViewModel(document: DocumentItemResponse): DocumentViewModel {
  const expiry = getOperationalDateViewModel('DOCUMENT_EXPIRY', document.expiry_date)
  const fileAvailable = Boolean(document.file_id)

  if (document.submission_status === 'MISSING') {
    return {
      id: document.worker_document_id,
      workerId: document.worker_id,
      workerName: document.display_name ?? '이름 미등록',
      typeLabel: DOCUMENT_TYPE_LABEL[document.document_type],
      workflowState: 'NOT_SUBMITTED',
      statusLabel: '서류 없음',
      statusTone: 'critical',
      expiry,
      fileAvailable: false,
      fileLabel: '파일 없음',
      actionLabel: '상세 확인',
      reviewable: false,
    }
  }

  if (expiry.expired) {
    return {
      id: document.worker_document_id,
      workerId: document.worker_id,
      workerName: document.display_name ?? '이름 미등록',
      typeLabel: DOCUMENT_TYPE_LABEL[document.document_type],
      workflowState: 'EXPIRED',
      statusLabel: '만료',
      statusTone: 'critical',
      expiry,
      fileAvailable,
      fileLabel: fileAvailable ? '파일 연결됨' : '파일 없음',
      actionLabel: '교체 요청',
      reviewable: false,
    }
  }

  if (document.submission_status === 'SUBMITTED') {
    return {
      id: document.worker_document_id,
      workerId: document.worker_id,
      workerName: document.display_name ?? '이름 미등록',
      typeLabel: DOCUMENT_TYPE_LABEL[document.document_type],
      workflowState: 'REVIEW_REQUIRED',
      statusLabel: fileAvailable ? '승인 대기' : '파일 연결 확인',
      statusTone: fileAvailable ? 'warning' : 'critical',
      expiry,
      fileAvailable,
      fileLabel: fileAvailable ? '파일 연결됨' : '파일 없음',
      actionLabel: fileAvailable ? '검토하기 →' : '연결 확인',
      reviewable: fileAvailable,
    }
  }

  return {
    id: document.worker_document_id,
    workerId: document.worker_id,
    workerName: document.display_name ?? '이름 미등록',
    typeLabel: DOCUMENT_TYPE_LABEL[document.document_type],
    workflowState: 'COMPLETED',
    statusLabel: '완료',
    statusTone: 'success',
    expiry,
    fileAvailable,
    fileLabel: fileAvailable ? '파일 연결됨' : '파일 없음',
    actionLabel: fileAvailable ? '보기' : '상세 확인',
    reviewable: false,
  }
}
