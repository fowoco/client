import type { StatusTone } from '../../components/ui/StatusLabel/StatusLabel'

// TODO(backend): GET /api/documents?tab=&q= -> DOCUMENT_TABS, DOCUMENTS 대체

export interface DocumentTab {
  id: string
  label: string
  count: number
}

export const DOCUMENT_TABS: DocumentTab[] = [
  { id: 'all', label: '전체', count: 18 },
  { id: 'missing', label: '미제출', count: 5 },
  { id: 'pending', label: '확인 대기', count: 4 },
  { id: 'done', label: '확인 완료', count: 9 },
]

export type DocumentStatus = 'missing' | 'pending' | 'done'

export const DOCUMENT_STATUS_TONE: Record<DocumentStatus, StatusTone> = {
  missing: 'critical',
  pending: 'warning',
  done: 'success',
}

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  missing: '미제출',
  pending: '확인 대기',
  done: '확인 완료',
}

export interface DocumentItem {
  id: string
  workerName: string
  docType: string
  status: DocumentStatus
  submittedAt: string
}

export const DOCUMENTS: DocumentItem[] = [
  {
    id: 'DOC-1',
    workerName: '수라즈C',
    docType: '외국인등록증 사본',
    status: 'missing',
    submittedAt: '미제출',
  },
  {
    id: 'DOC-2',
    workerName: '쩐티B',
    docType: '표준근로계약서',
    status: 'pending',
    submittedAt: '2026-07-18',
  },
  {
    id: 'DOC-3',
    workerName: '아흐메드D',
    docType: '건강진단서',
    status: 'missing',
    submittedAt: '미제출',
  },
  {
    id: 'DOC-4',
    workerName: '응웬반A',
    docType: '체류연장 신청서',
    status: 'pending',
    submittedAt: '2026-07-19',
  },
  {
    id: 'DOC-5',
    workerName: '박서준',
    docType: '숙소 임대차 계약서',
    status: 'done',
    submittedAt: '2026-07-10',
  },
]

export const TOTAL_DOCUMENT_COUNT = 18
