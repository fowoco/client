import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ToastViewport } from '../../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../../store/toastStore'
import { ImportWizardModal } from './ImportWizardModal'

function renderWizard() {
  render(
    <>
      <ImportWizardModal open onClose={() => {}} />
      <ToastViewport />
    </>,
  )
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

afterEach(() => {
  useToastStore.setState({ toasts: [] })
})

async function advanceToStep3(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '다음 →' }))
  expect(screen.getByRole('dialog', { name: '파일 가져오기 · 컬럼 매핑' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '다음 →' }))
  expect(screen.getByRole('dialog', { name: '파일 가져오기 · 오류·충돌 검토' })).toBeInTheDocument()
}

describe('ImportWizardModal', () => {
  it('starts on step 1 showing the file name and a row preview', () => {
    renderWizard()

    expect(screen.getByRole('dialog', { name: '파일 가져오기 · 파일 확인' })).toBeInTheDocument()
    expect(screen.getByText('근로자_명단_2026.xlsx')).toBeInTheDocument()
    expect(screen.getByText('5행 감지됨')).toBeInTheDocument()
    expect(screen.getByText('응웬반A')).toBeInTheDocument()
  })

  it('shows every detected column mapped to a system field by default on step 2', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(screen.getByRole('button', { name: '다음 →' }))
    expect(screen.getByRole('dialog', { name: '파일 가져오기 · 컬럼 매핑' })).toBeInTheDocument()

    // 감지된 4개 열이 전부 추천 매핑으로 미리 채워져 있어 바로 다음으로 진행 가능해야 한다.
    expect(screen.getByRole('button', { name: '다음 →' })).toBeEnabled()
  })

  it('blocks moving past step 3 while conflicts or failures remain', async () => {
    const user = userEvent.setup()
    renderWizard()
    await advanceToStep3(user)

    expect(screen.getByRole('button', { name: '다음 →' })).toBeDisabled()
  })

  it('resolves a conflict via ConflictResolverModal and unblocks step 3', async () => {
    const user = userEvent.setup()
    renderWizard()
    await advanceToStep3(user)

    await user.click(screen.getByRole('button', { name: '충돌 해결' }))
    expect(screen.getByRole('dialog', { name: '체류만료일 충돌 해결' })).toBeInTheDocument()

    await user.click(screen.getByText('2026-08-20'))
    await user.click(screen.getByRole('button', { name: '이 값 적용' }))

    expect(screen.getByText('충돌을 해결했습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '충돌 해결' })).not.toBeInTheDocument()
  })

  it('retries a failed row with a corrected date via FailedRowRetryModal', async () => {
    const user = userEvent.setup()
    renderWizard()
    await advanceToStep3(user)

    await user.click(screen.getByRole('button', { name: '재처리' }))
    expect(screen.getByRole('dialog', { name: '행 재처리' })).toBeInTheDocument()

    const input = screen.getByPlaceholderText('YYYY-MM-DD')
    await user.clear(input)
    await user.type(input, 'not-a-date')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(screen.getByText(/YYYY-MM-DD 형식으로 입력해 주세요/)).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, '2026-12-01')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(screen.getByText('행을 재처리했습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '재처리' })).not.toBeInTheDocument()
  })

  it('shows a missing-document request draft and sends it without blocking progress', async () => {
    const user = userEvent.setup()
    renderWizard()
    await advanceToStep3(user)

    await user.click(screen.getByRole('button', { name: '요청 미리보기' }))
    expect(screen.getByRole('dialog', { name: '누락 서류 요청 미리보기' })).toBeInTheDocument()
    expect(screen.getByText(/안녕하세요 아흐메드D님/)).toBeInTheDocument()
    expect(screen.getByText(/여권 사본, 표준근로계약서/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '안내 보내기' }))

    expect(screen.getByText('서류 요청 안내를 보냈습니다.')).toBeInTheDocument()
  })

  it('opens the document bundle drawer', async () => {
    const user = userEvent.setup()
    renderWizard()
    await advanceToStep3(user)

    await user.click(screen.getByRole('button', { name: '서류 묶음 보기 →' }))

    expect(screen.getByRole('dialog', { name: '함께 첨부된 서류' })).toBeInTheDocument()
    expect(screen.getByText('응웬반A_여권사본.pdf')).toBeInTheDocument()
  })

  it('completes the wizard end to end and shows a summary on step 4', async () => {
    const user = userEvent.setup()
    renderWizard()
    await advanceToStep3(user)

    await user.click(screen.getByRole('button', { name: '충돌 해결' }))
    await user.click(screen.getByRole('button', { name: '이 값 적용' }))

    await user.click(screen.getByRole('button', { name: '재처리' }))
    const input = screen.getByPlaceholderText('YYYY-MM-DD')
    await user.clear(input)
    await user.type(input, '2026-12-01')
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    await user.click(screen.getByRole('button', { name: '다음 →' }))
    expect(screen.getByRole('dialog', { name: '파일 가져오기 · 등록 결과' })).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '완료' }))

    expect(screen.getByText('5명의 근로자 정보를 등록했습니다.')).toBeInTheDocument()
  })
})
