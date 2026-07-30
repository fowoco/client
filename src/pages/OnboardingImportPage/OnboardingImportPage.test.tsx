import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OnboardingImportPage } from './OnboardingImportPage'
import { isOnboardingImportPending, markOnboardingImportPending } from './onboardingImportStorage'

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/onboarding/import']}>
      <Routes>
        <Route path="/onboarding/import" element={<OnboardingImportPage />} />
        <Route path="/dashboard" element={<p>dashboard screen</p>} />
        <Route path="/workers" element={<p>workers screen</p>} />
        <Route path="/documents" element={<p>documents screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  markOnboardingImportPending()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('OnboardingImportPage', () => {
  it('renders the three start options with "다음" disabled until one is chosen', async () => {
    const user = userEvent.setup()
    renderPage()

    const next = screen.getByRole('button', { name: '다음 →' })
    expect(next).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /직접 입력/ }))
    expect(next).toBeEnabled()
  })

  it('clears the pending flag and goes straight to the dashboard when "나중에 설정" is chosen', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /나중에 설정/ }))
    await user.click(screen.getByRole('button', { name: '다음 →' }))

    expect(await screen.findByText('dashboard screen')).toBeInTheDocument()
    expect(isOnboardingImportPending()).toBe(false)
  })

  it('sends "직접 입력" to the worker list instead of the import flow', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /직접 입력/ }))
    await user.click(screen.getByRole('button', { name: '다음 →' }))

    expect(await screen.findByText('workers screen')).toBeInTheDocument()
  })

  it('walks through the full migrate → upload → analyze → review → result flow', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup()
    renderPage()

    // Step 1: choose migrate
    await user.click(screen.getByRole('button', { name: /기존 데이터 이전/ }))
    await user.click(screen.getByRole('button', { name: '다음 →' }))

    // Step 2: upload a file
    expect(screen.getByText('근로자 파일을 올려주세요.')).toBeInTheDocument()
    const file = new File(['content'], 'workers.xlsx', { type: 'application/vnd.ms-excel' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)
    expect(screen.getByText('workers.xlsx')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '자료 분석 시작 →' }))

    // Step 3: analysis auto-advances after all stages complete
    expect(screen.getByText('자료를 분석하고 있습니다.')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(3000)
    expect(await screen.findByText('근로자·문서 후보를 검토합니다.')).toBeInTheDocument()

    // Step 4: resolve the three blocked candidates
    const confirmButtons = screen.getAllByRole('button', { name: '확인 완료' })
    for (const button of confirmButtons) {
      await user.click(button)
    }
    const registerButton = screen.getByRole('button', { name: '등록 확정 →' })
    expect(registerButton).toBeEnabled()
    await user.click(registerButton)

    // Step 5: finish to dashboard
    expect(await screen.findByText('4명 등록을 완료했습니다.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '대시보드로 이동' }))

    expect(await screen.findByText('dashboard screen')).toBeInTheDocument()
    expect(isOnboardingImportPending()).toBe(false)
  })

  it('shows step progress in the header', () => {
    renderPage()
    expect(screen.getByText('1 / 5 · 시작 방식')).toBeInTheDocument()
  })
})
