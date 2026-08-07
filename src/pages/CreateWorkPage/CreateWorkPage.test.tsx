import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { CreateWorkPage } from './CreateWorkPage'
import { DEFAULT_ORIGINAL_REQUEST, WORKFLOW_TASKS } from './createWorkData'

function ReviewStub() {
  const location = useLocation()
  return <p>검토 화면{location.search}</p>
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

afterEach(() => {
  useToastStore.setState({ toasts: [] })
})

function renderPage(initialEntry: string | { pathname: string; state?: unknown } = '/tasks/new') {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/tasks/new"
          element={
            <>
              <CreateWorkPage />
              <ToastViewport />
            </>
          }
        />
        <Route path="/tasks/new/review" element={<ReviewStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CreateWorkPage', () => {
  it('shows the request forwarded from the dashboard as the original request', () => {
    renderPage({ pathname: '/tasks/new', state: { prefill: '응웬반A 체류기간 연장 준비' } })

    expect(screen.getByText('응웬반A 체류기간 연장 준비')).toBeInTheDocument()
  })

  it('falls back to a default original request when nothing was forwarded', () => {
    renderPage()

    expect(screen.getByText(DEFAULT_ORIGINAL_REQUEST.split('\n')[0])).toBeInTheDocument()
  })

  it('renders every candidate task in the work item', () => {
    renderPage()

    for (const task of WORKFLOW_TASKS) {
      expect(screen.getByText(task.title)).toBeInTheDocument()
    }
  })

  it('navigates to the review flow when moving to information review', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '정보 보완' }))

    expect(await screen.findByText('검토 화면')).toBeInTheDocument()
  })

  it('jumps to a later review step when clicking it in the shared step indicator', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '3 초안 작성' }))

    expect(await screen.findByText('검토 화면?step=2')).toBeInTheDocument()
  })

  it('opens the file import wizard from the work item panel', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '파일로 근로자 명단 가져오기 →' }))

    expect(screen.getByRole('dialog', { name: '파일 가져오기 · 파일 확인' })).toBeInTheDocument()
  })

  it('shows a toast when editing the original request', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '원문 수정' }))

    expect(screen.getByText('원문 수정은 준비 중입니다.')).toBeInTheDocument()
  })
})
