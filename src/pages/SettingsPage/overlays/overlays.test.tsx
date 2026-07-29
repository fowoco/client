import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InviteMemberModal } from './InviteMemberModal'
import { LinkReissueModal } from './LinkReissueModal'
import { LinkReissuedModal } from './LinkReissuedModal'
import { ToastViewport } from '../../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../../store/toastStore'
import { SECURITY_LINK_HISTORY } from '../settingsData'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('LinkReissueModal', () => {
  it('renders the target worker and submits the current selections', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const entry = SECURITY_LINK_HISTORY[0]
    render(<LinkReissueModal open entry={entry} onClose={vi.fn()} onSubmit={onSubmit} />)

    expect(screen.getByText(`${entry.workerName} · E-9`)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '이메일 초안' }))
    await user.click(screen.getByRole('button', { name: '7일' }))
    await user.click(screen.getByRole('button', { name: '새 링크 생성' }))

    expect(onSubmit).toHaveBeenCalledWith({
      reason: '기존 링크 만료',
      channel: '이메일 초안',
      expiry: '7일',
    })
  })

  it('calls onClose when cancelled', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <LinkReissueModal open entry={SECURITY_LINK_HISTORY[0]} onClose={onClose} onSubmit={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('LinkReissuedModal', () => {
  function renderModal(onClose = vi.fn()) {
    render(
      <>
        <LinkReissuedModal
          open
          submission={{ reason: '기존 링크 만료', channel: '링크 복사', expiry: '72시간' }}
          onClose={onClose}
        />
        <ToastViewport />
      </>,
    )
  }

  it('shows the reissue result and activity record', () => {
    renderModal()

    expect(screen.getByText('✓ 기존 링크 폐기 완료')).toBeInTheDocument()
    expect(screen.getByText('✓ 새 링크만 유효 · 72시간')).toBeInTheDocument()
  })

  it('copies the new link to the clipboard and shows a toast', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderModal()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    await user.click(screen.getByRole('button', { name: '새 링크 복사' }))

    expect(writeText).toHaveBeenCalledWith('fowoco.kr/s/7K9P-****-Q2M4')
    expect(screen.getByText('링크를 복사했습니다.')).toBeInTheDocument()
  })

  it('calls onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderModal(onClose)

    // Modal 자체의 닫기(X) 버튼도 접근성 이름이 "닫기"라 마지막(본문의 텍스트 링크)을 선택한다.
    const closeButtons = screen.getAllByRole('button', { name: '닫기' })
    await user.click(closeButtons[closeButtons.length - 1])

    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('InviteMemberModal', () => {
  it('defaults to HR_STAFF and submits the entered email with the selected role', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<InviteMemberModal open onClose={vi.fn()} onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText('name@company.com'), 'invite@fowoco.com')
    await user.click(screen.getByRole('button', { name: '조회 전용' }))
    await user.click(screen.getByRole('button', { name: '초대 보내기' }))

    expect(onSubmit).toHaveBeenCalledWith({ email: 'invite@fowoco.com', role: 'VIEWER' })
  })

  it('shows a validation error and does not submit for an invalid email', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<InviteMemberModal open onClose={vi.fn()} onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText('name@company.com'), '이메일아님')
    await user.click(screen.getByRole('button', { name: '초대 보내기' }))

    expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onClose when cancelled', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<InviteMemberModal open onClose={onClose} onSubmit={vi.fn()} />)

    await user.type(screen.getByPlaceholderText('name@company.com'), 'invite@fowoco.com')
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})
