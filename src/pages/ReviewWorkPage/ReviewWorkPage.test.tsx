import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { ReviewWorkPage } from './ReviewWorkPage'
import { DRAFT_DOCUMENTS, HR_VERIFICATION_FIELDS, REVIEW_STEPS, STRUCTURED_FIELDS } from './reviewWorkData'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

afterEach(() => {
  vi.useRealTimers()
})

function renderPage(path = '/tasks/new/review') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/tasks/new/review" element={<ReviewWorkPage />} />
        <Route path="/tasks" element={<p>업무함</p>} />
        <Route path="/tasks/new" element={<p>업무 생성 페이지</p>} />
      </Routes>
      <ToastViewport />
    </MemoryRouter>,
  )
}

async function fillVerificationFields(user: ReturnType<typeof userEvent.setup>) {
  for (const field of HR_VERIFICATION_FIELDS) {
    await user.type(screen.getByLabelText(field.label), '2027-01-01')
  }
}

describe('ReviewWorkPage', () => {
  it('renders every step of the shared progress indicator', () => {
    renderPage()
    const indicator = screen.getByRole('list', { name: '진행 단계' })
    expect(within(indicator).getAllByRole('listitem')).toHaveLength(REVIEW_STEPS.length)
  })

  it('renders the information pending table with editable HR fields', () => {
    renderPage()

    expect(screen.getByText('누락정보를 해결 주체별로 확인해 주세요')).toBeInTheDocument()
    for (const field of HR_VERIFICATION_FIELDS) {
      expect(screen.getByLabelText(field.label)).toBeInTheDocument()
    }
  })

  it('shows a toast when saving a temporary draft', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '임시 저장' }))

    expect(screen.getByText('임시 저장했습니다.')).toBeInTheDocument()
  })

  it('disables the draft generation button until every HR verification field is filled', async () => {
    const user = userEvent.setup()
    renderPage()

    const generate = screen.getByRole('button', { name: '초안 생성' })
    expect(generate).toBeDisabled()

    await fillVerificationFields(user)

    expect(generate).toBeEnabled()
  })

  it('advances through draft preparation to final review and can navigate to the task list', async () => {
    const user = userEvent.setup()
    renderPage()
    await fillVerificationFields(user)
    await user.click(screen.getByRole('button', { name: '초안 생성' }))

    expect(await screen.findByText('생성된 문서와 대기 중인 문서를 확인해 주세요')).toBeInTheDocument()
    for (const doc of DRAFT_DOCUMENTS) {
      expect(screen.getByText(doc.title)).toBeInTheDocument()
    }

    const draftReviewButtons = screen.getAllByRole('button', { name: '초안 검토' })
    await user.click(draftReviewButtons[draftReviewButtons.length - 1])

    expect(await screen.findByText('문서 검토본과 입력값을 최종 확인해 주세요')).toBeInTheDocument()
    for (const field of STRUCTURED_FIELDS) {
      expect(screen.getAllByText(field.label).length).toBeGreaterThan(0)
    }

    await user.click(screen.getByRole('button', { name: '승인 요청' }))

    expect(await screen.findByRole('heading', { name: /승인이 완료됐습니다./ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '업무함으로 이동 →' }))

    expect(await screen.findByText('업무함')).toBeInTheDocument()
  })

  it('opens directly on a given step via the ?step= query param', () => {
    renderPage('/tasks/new/review?step=3')

    expect(screen.getByText('문서 검토본과 입력값을 최종 확인해 주세요')).toBeInTheDocument()
  })

  it('jumps freely between steps by clicking the shared indicator', async () => {
    const user = userEvent.setup()
    renderPage('/tasks/new/review?step=3')

    await user.click(screen.getByRole('button', { name: '✓ 정보 보완' }))
    expect(screen.getByText('누락정보를 해결 주체별로 확인해 주세요')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '✓ 요청 확인' }))
    expect(await screen.findByText('업무 생성 페이지')).toBeInTheDocument()
  })
})
