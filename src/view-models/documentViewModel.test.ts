import { describe, expect, it } from 'vitest'
import type { DocumentItemResponse } from '../api/documents'
import { getDocumentViewModel } from './documentViewModel'

function document(overrides: Partial<DocumentItemResponse> = {}): DocumentItemResponse {
  return {
    worker_document_id: 'D-1',
    worker_id: 'W-1',
    display_name: '응웬반A',
    document_type: 'PASSPORT_COPY',
    submission_status: 'MISSING',
    expiry_date: null,
    file_id: null,
    ...overrides,
  }
}

describe('getDocumentViewModel', () => {
  it('does not infer that a missing document was requested', () => {
    expect(getDocumentViewModel(document())).toMatchObject({
      workflowState: 'NOT_SUBMITTED',
      statusLabel: '서류 없음',
      actionLabel: '상세 확인',
      fileAvailable: false,
    })
  })

  it('shows generated application files as drafts', () => {
    expect(
      getDocumentViewModel(
        document({
          document_type: 'INTEGRATED_APPLICATION',
          submission_status: 'DRAFT',
          file_id: 'F-1',
        }),
      ),
    ).toMatchObject({ workflowState: 'DRAFT', statusLabel: '초안', fileAvailable: true })
  })

  it('requires a real file before a submitted document can be reviewed', () => {
    expect(getDocumentViewModel(document({ submission_status: 'SUBMITTED' }))).toMatchObject({
      statusLabel: '파일 연결 확인',
      reviewable: false,
    })
    expect(
      getDocumentViewModel(document({ submission_status: 'SUBMITTED', file_id: 'F-1' })),
    ).toMatchObject({
      statusLabel: '승인 대기',
      actionLabel: '검토하기 →',
      reviewable: true,
    })
  })

  it('surfaces expiry separately from submission completion', () => {
    const expired = new Date()
    expired.setDate(expired.getDate() - 1)
    const expiryDate = [
      expired.getFullYear(),
      String(expired.getMonth() + 1).padStart(2, '0'),
      String(expired.getDate()).padStart(2, '0'),
    ].join('-')

    expect(
      getDocumentViewModel(
        document({
          submission_status: 'VERIFIED',
          expiry_date: expiryDate,
          file_id: 'F-1',
        }),
      ),
    ).toMatchObject({ workflowState: 'EXPIRED', statusLabel: '만료', actionLabel: '교체 요청' })
  })
})
