import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { CreateWorkPage } from './CreateWorkPage'

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
  it('uses a request forwarded from the dashboard as the initial input', () => {
    renderPage({ pathname: '/tasks/new', state: { prefill: '응웬반A 체류기간 연장 준비' } })

    expect(screen.getByLabelText('업무 요청 내용')).toHaveValue('응웬반A 체류기간 연장 준비')
  })

  it('disables the analyze button until a request is entered', async () => {
    const user = userEvent.setup()
    renderPage()

    const analyze = screen.getByRole('button', { name: '요청 분석하기 →' })
    expect(analyze).toBeDisabled()

    await user.type(screen.getByLabelText('업무 요청 내용'), '체류연장 서류 준비')
    expect(analyze).toBeEnabled()
  })

  it('fills the textarea when an example chip is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '체류연장 준비' }))

    expect(screen.getByLabelText('업무 요청 내용')).toHaveValue('체류연장 준비')
  })

  it('navigates to the review flow when analyzing a request', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('업무 요청 내용'), '체류연장 서류 준비')
    await user.click(screen.getByRole('button', { name: '요청 분석하기 →' }))

    expect(await screen.findByText('검토 화면')).toBeInTheDocument()
  })

  it('jumps to a later review step when clicking it in the shared step indicator', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '초안 검토' }))

    expect(await screen.findByText('검토 화면?step=2')).toBeInTheDocument()
  })

  it('switches the active input mode', async () => {
    const user = userEvent.setup()
    renderPage()

    const fileMode = screen.getByRole('button', { name: /파일 가져오기/ })
    await user.click(fileMode)

    expect(fileMode.className).toMatch(/modeCardActive/)
  })

  it('opens the file import wizard from 파일 가져오기 mode', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /파일 가져오기/ }))
    await user.click(screen.getByRole('button', { name: '파일 선택하기 →' }))

    expect(screen.getByRole('dialog', { name: '파일 가져오기 · 파일 확인' })).toBeInTheDocument()
  })

  it('shows a toast when a draft is saved', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '임시 저장' }))

    expect(screen.getByText('초안을 저장했습니다.')).toBeInTheDocument()
  })
})
