import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApprovalRequestModal } from './ApprovalRequestModal'
import { ApprovalDecisionModal } from './ApprovalDecisionModal'
import { RejectionReasonModal } from './RejectionReasonModal'
import { OtherApproverHandledModal } from './OtherApproverHandledModal'
import { ApprovalSnapshotDiffModal } from './ApprovalSnapshotDiffModal'

describe('ApprovalRequestModal', () => {
  it('calls onSubmit when the request button is clicked', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ApprovalRequestModal open onClose={vi.fn()} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: '승인 요청 보내기' }))

    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ApprovalRequestModal open onClose={onClose} onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('ApprovalDecisionModal', () => {
  it('calls onApprove/onReject', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    const onReject = vi.fn()
    render(<ApprovalDecisionModal open onClose={vi.fn()} onApprove={onApprove} onReject={onReject} />)

    await user.click(screen.getByRole('button', { name: '반려' }))
    expect(onReject).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: '승인' }))
    expect(onApprove).toHaveBeenCalledOnce()
  })
})

describe('RejectionReasonModal', () => {
  it('disables confirm until a reason is entered, then calls onConfirm with it', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<RejectionReasonModal open onBack={vi.fn()} onConfirm={onConfirm} />)

    const confirmButton = screen.getByRole('button', { name: '반려 확정' })
    expect(confirmButton).toBeDisabled()

    await user.type(screen.getByPlaceholderText('반려 사유를 입력하세요'), '사유 입력')
    expect(confirmButton).toBeEnabled()

    await user.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledWith('사유 입력')
  })

  it('calls onBack when going back', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<RejectionReasonModal open onBack={onBack} onConfirm={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '돌아가기' }))

    expect(onBack).toHaveBeenCalledOnce()
  })
})

describe('OtherApproverHandledModal', () => {
  it('calls onClose when confirmed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<OtherApproverHandledModal open onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: '확인' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('ApprovalSnapshotDiffModal', () => {
  it('renders diff rows and calls onRequestReapproval', async () => {
    const user = userEvent.setup()
    const onRequestReapproval = vi.fn()
    render(<ApprovalSnapshotDiffModal open onClose={vi.fn()} onRequestReapproval={onRequestReapproval} />)

    expect(screen.getByText('마감일')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '재승인 요청' }))

    expect(onRequestReapproval).toHaveBeenCalledOnce()
  })
})
