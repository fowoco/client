import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DocumentListPage } from './DocumentListPage'
import { DOCUMENT_TABS, DOCUMENTS } from './documentListData'

function renderPage(demoState = 'success') {
  render(
    <MemoryRouter initialEntries={[`/documents?demoState=${demoState}`]}>
      <DocumentListPage />
    </MemoryRouter>,
  )
}

describe('DocumentListPage', () => {
  it('renders every tab and document row', () => {
    renderPage()

    for (const tab of DOCUMENT_TABS) {
      expect(screen.getByRole('tab', { name: `${tab.label} ${tab.count}` })).toBeInTheDocument()
    }
    for (const document of DOCUMENTS) {
      expect(screen.getByText(document.workerName)).toBeInTheDocument()
    }
  })

  it('filters documents by search query', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('서류 검색'), '표준근로계약서')

    await waitFor(() => {
      expect(screen.queryByText('수라즈C')).not.toBeInTheDocument()
    })
    expect(screen.getByText('쩐티B')).toBeInTheDocument()
  })

  it('filters documents by tab', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: '미제출 5' }))

    expect(screen.getByText('수라즈C')).toBeInTheDocument()
    expect(screen.queryByText('박서준')).not.toBeInTheDocument()
  })

  it('shows an empty state when a search has no matches', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('서류 검색'), '존재하지않는검색어')

    expect(await screen.findByText('검색 결과가 없습니다')).toBeInTheDocument()
  })

  it('shows a loading state', () => {
    renderPage('loading')
    expect(screen.getByText('서류 목록을 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an error state', () => {
    renderPage('error')
    expect(screen.getByText('서류 목록을 불러오지 못했습니다')).toBeInTheDocument()
  })
})
