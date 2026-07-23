import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HelpModal, type HelpModalProps } from './HelpModal'
import { ToastViewport } from '../../ui/ToastViewport/ToastViewport'
import { DEMO_ACCOUNT } from '../../../store/authStore'
import { useToastStore } from '../../../store/toastStore'
import { HELP_FAQ } from './helpContent'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

function renderHelpModal(props: HelpModalProps) {
  render(
    <>
      <HelpModal {...props} />
      <ToastViewport />
    </>,
  )
}

// userEvent.setup()이 자체 clipboard stub을 navigator.clipboard에 설치하므로, 우리 mock은
// setup() 이후에 정의해야 덮어씌워지지 않는다.
function stubClipboardWriteText(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
}

describe('HelpModal', () => {
  it('renders nothing when closed', () => {
    renderHelpModal({ open: false, onClose: vi.fn() })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the first FAQ answer expanded by default and toggles others', async () => {
    const user = userEvent.setup()
    renderHelpModal({ open: true, onClose: vi.fn() })

    expect(screen.getByText(HELP_FAQ[0].answer)).toBeInTheDocument()
    expect(screen.queryByText(HELP_FAQ[1].answer)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: new RegExp(HELP_FAQ[1].question) }))
    expect(screen.getByText(HELP_FAQ[1].answer)).toBeInTheDocument()
    expect(screen.queryByText(HELP_FAQ[0].answer)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: new RegExp(HELP_FAQ[1].question) }))
    expect(screen.queryByText(HELP_FAQ[1].answer)).not.toBeInTheDocument()
  })

  it('copies the demo account to the clipboard and shows a toast', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboardWriteText(writeText)
    renderHelpModal({ open: true, onClose: vi.fn() })

    await user.click(screen.getByRole('button', { name: '복사' }))

    expect(writeText).toHaveBeenCalledWith(`${DEMO_ACCOUNT.email} / ${DEMO_ACCOUNT.password}`)
    expect(screen.getByText('데모 계정을 복사했습니다.')).toBeInTheDocument()
  })

  it('shows a fallback toast when clipboard copy fails', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    stubClipboardWriteText(writeText)
    renderHelpModal({ open: true, onClose: vi.fn() })

    await user.click(screen.getByRole('button', { name: '복사' }))

    expect(screen.getByText('복사에 실패했습니다. 직접 선택해 복사해 주세요.')).toBeInTheDocument()
  })
})
