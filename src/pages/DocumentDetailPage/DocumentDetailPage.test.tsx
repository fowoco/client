import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DocumentDetailPage } from './DocumentDetailPage'
import { DOCUMENTS } from '../DocumentListPage/documentListData'

function renderPage(documentId: string) {
  render(
    <MemoryRouter initialEntries={[`/documents/${documentId}`]}>
      <Routes>
        <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
        <Route path="/documents" element={<p>서류 목록</p>} />
        <Route path="/workers/:workerId" element={<p>근로자 상세</p>} />
        <Route path="/tasks/:caseId" element={<p>업무 상세</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DocumentDetailPage', () => {
  it('renders the document type and worker name', () => {
    const document = DOCUMENTS[0]
    renderPage(document.id)

    expect(screen.getByRole('heading', { name: document.docType })).toBeInTheDocument()
    expect(screen.getAllByText(document.workerName, { exact: false }).length).toBeGreaterThan(0)
    expect(screen.getByText(`${document.docType}.pdf`)).toBeInTheDocument()
  })

  it('navigates to the related worker and task', async () => {
    const user = userEvent.setup()
    const document = DOCUMENTS.find((item) => item.workerName === '응웬반A')!
    renderPage(document.id)

    await user.click(screen.getByRole('button', { name: '응웬반A 근로자 정보 →' }))

    expect(await screen.findByText('근로자 상세')).toBeInTheDocument()
  })

  it('shows an empty state when there is no matching worker', () => {
    const document = DOCUMENTS.find((item) => item.workerName === '박서준')!
    renderPage(document.id)

    expect(screen.getByText('연결된 근로자를 찾을 수 없습니다')).toBeInTheDocument()
  })

  it('approves and rejects the document, toggling status', async () => {
    const user = userEvent.setup()
    const document = DOCUMENTS[0]
    renderPage(document.id)

    await user.click(screen.getByRole('button', { name: '확인 완료 처리' }))
    expect(screen.getByText('확인 완료')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '반려' }))
    expect(screen.getByText('미제출')).toBeInTheDocument()
  })

  it('falls back to the first document when the documentId is invalid', () => {
    renderPage('does-not-exist')

    expect(screen.getByRole('heading', { name: DOCUMENTS[0].docType })).toBeInTheDocument()
  })
})
