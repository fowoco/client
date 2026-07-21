import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { CaseDetailPage } from './CaseDetailPage'
import {
  CASE_ACTIVITY,
  CASE_CHECKLIST,
  CASE_COMMUNICATION,
  CASE_DOCUMENTS,
  CASE_HEADER,
  CASE_STEPS,
  CASE_TABS,
} from './caseDetailData'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

function renderPage() {
  render(
    <MemoryRouter>
      <CaseDetailPage />
      <ToastViewport />
    </MemoryRouter>,
  )
}

describe('CaseDetailPage', () => {
  it('renders the case title and every step', () => {
    renderPage()
    expect(screen.getByText(CASE_HEADER.title)).toBeInTheDocument()
    for (const step of CASE_STEPS) {
      expect(screen.getByText(step.title)).toBeInTheDocument()
    }
  })

  it('switches to the checklist tab and shows checklist content', async () => {
    const user = userEvent.setup()
    renderPage()

    const checklistTab = screen.getByRole('tab', { name: CASE_TABS[1] })
    await user.click(checklistTab)

    expect(checklistTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(CASE_CHECKLIST[0].label)).toBeInTheDocument()
    expect(screen.queryByText(CASE_HEADER.title)).toBeInTheDocument()
    expect(screen.queryByText('처리 단계')).not.toBeInTheDocument()
  })

  it('switches to the document tab and shows document content', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: CASE_TABS[2] }))

    expect(screen.getByText(CASE_DOCUMENTS[0].name)).toBeInTheDocument()
  })

  it('switches to the communication tab and shows message content', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: CASE_TABS[3] }))

    expect(screen.getByText(CASE_COMMUNICATION[0].message)).toBeInTheDocument()
  })

  it('switches to the activity tab and shows activity content', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: CASE_TABS[4] }))

    expect(screen.getByText(CASE_ACTIVITY[0].label)).toBeInTheDocument()
  })

  it('renders the blocked completion banner', () => {
    renderPage()
    expect(screen.getByText('완료 처리 불가 · 승인과 증빙 필요')).toBeInTheDocument()
  })

  it('shows a toast when a draft is saved', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '초안 저장' }))

    expect(screen.getByText('초안을 저장했습니다.')).toBeInTheDocument()
  })

  it('shows a toast when approval is requested', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '승인 요청' }))

    expect(screen.getByText('승인을 요청했습니다.')).toBeInTheDocument()
  })
})
