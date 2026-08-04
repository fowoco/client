import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { ReviewWorkPage } from './ReviewWorkPage'
import {
  ANALYSIS_STAGES,
  APPROVAL_SUMMARY,
  DRAFT_REASONS,
  HR_VERIFICATION_FIELDS,
  PREPARED_CHECKLIST,
  PREPARED_DRAFT,
  REVIEW_STEPS,
  TASK_CREATION_SUMMARY,
  UNDERSTOOD_REQUEST,
} from './reviewWorkData'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

afterEach(() => {
  vi.useRealTimers()
})

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/tasks/new/review']}>
      <Routes>
        <Route path="/tasks/new/review" element={<ReviewWorkPage />} />
        <Route path="/tasks" element={<p>업무함</p>} />
      </Routes>
      <ToastViewport />
    </MemoryRouter>,
  )
}

async function advanceToDraftReview(user: ReturnType<typeof userEvent.setup>) {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  renderPage()
  await vi.advanceTimersByTimeAsync(3000)
  expect(await screen.findByText('Agent가 요청을 1개의 업무로 정리했습니다.')).toBeInTheDocument()
  return user
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
    for (const step of REVIEW_STEPS) {
      expect(screen.getAllByText(step.label).length).toBeGreaterThan(0)
    }
  })

  it('walks through the analysis stages and lands on the draft review step', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderPage()

    expect(screen.getByText('Agent가 요청을 분석하고 있습니다.')).toBeInTheDocument()
    for (const stage of ANALYSIS_STAGES) {
      expect(screen.getByText(stage)).toBeInTheDocument()
    }

    await vi.advanceTimersByTimeAsync(3000)

    expect(await screen.findByText('Agent가 요청을 1개의 업무로 정리했습니다.')).toBeInTheDocument()
  })

  it('renders the understood request, prepared draft, and checklist/reasoning on the draft step', async () => {
    const user = await advanceToDraftReview(userEvent.setup())

    expect(screen.getByText(UNDERSTOOD_REQUEST.purpose)).toBeInTheDocument()
    expect(screen.getAllByText(PREPARED_DRAFT.target as string).length).toBeGreaterThan(0)
    expect(screen.getByText(`기한 · ${PREPARED_DRAFT.dueLabel}`)).toBeInTheDocument()
    expect(screen.getByText(`필수 단계 ${PREPARED_DRAFT.requiredStepCount}개`)).toBeInTheDocument()
    for (const item of PREPARED_CHECKLIST) {
      expect(screen.getByText(item)).toBeInTheDocument()
    }
    for (const reason of DRAFT_REASONS) {
      expect(screen.getByText(`· ${reason}`)).toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: '체크리스트 미리보기 ▾' })).not.toBeInTheDocument()

    void user
  })

  it('shows a target dropdown instead of static text when the target is not yet determined', async () => {
    const originalTarget = PREPARED_DRAFT.target
    PREPARED_DRAFT.target = null
    try {
      const user = await advanceToDraftReview(userEvent.setup())
      await user.click(screen.getByRole('button', { name: '대상 선택' }))
      await user.click(screen.getByRole('option', { name: '응웬반A' }))

      expect(screen.queryByRole('button', { name: '대상 선택' })).not.toBeInTheDocument()
      expect(screen.getByText('응웬반A')).toBeInTheDocument()
    } finally {
      PREPARED_DRAFT.target = originalTarget
    }
  })

  it('shows a toast when saving a temporary draft', async () => {
    const user = await advanceToDraftReview(userEvent.setup())

    await user.click(screen.getByRole('button', { name: '임시 저장' }))

    expect(screen.getByText('임시 저장했습니다.')).toBeInTheDocument()
  })

  it('shows a toast when viewing evidence', async () => {
    const user = await advanceToDraftReview(userEvent.setup())

    await user.click(screen.getByRole('button', { name: '근거 보기 ▾' }))

    expect(screen.getByText('분석 근거 보기는 준비 중입니다.')).toBeInTheDocument()
  })

  it('disables the complete button until every HR verification field is filled', async () => {
    const user = await advanceToDraftReview(userEvent.setup())

    const complete = screen.getByRole('button', { name: '완료' })
    expect(complete).toBeDisabled()

    await fillVerificationFields(user)

    expect(complete).toBeEnabled()
  })

  it('advances through task creation to the approval step and can navigate to the task list', async () => {
    const user = await advanceToDraftReview(userEvent.setup())
    await fillVerificationFields(user)
    await user.click(screen.getByRole('button', { name: '완료' }))

    expect(await screen.findByText(TASK_CREATION_SUMMARY.title)).toBeInTheDocument()
    expect(screen.getByText('업무를 생성했습니다.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '승인 요청으로 이동 →' }))

    expect(await screen.findByRole('heading', { name: '승인이 완료됐습니다.' })).toBeInTheDocument()
    expect(screen.getByText(`승인자 ${APPROVAL_SUMMARY.approver}`)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '업무함으로 이동 →' }))

    expect(await screen.findByText('업무함')).toBeInTheDocument()
  })
})
