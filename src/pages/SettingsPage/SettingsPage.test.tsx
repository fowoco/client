import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ToastViewport } from '../../components/ui/ToastViewport/ToastViewport'
import { useToastStore } from '../../store/toastStore'
import { SettingsPage } from './SettingsPage'
import {
  COMPLETION_EVIDENCE_RULES,
  DATA_LOG_SETTINGS,
  MEMBERS,
  PROCESS_STEP_RULES,
  SECURITY_LINK_HISTORY,
  SETTINGS_TABS,
} from './settingsData'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('SettingsPage', () => {
  it('renders every member row', () => {
    render(<SettingsPage />)
    for (const member of MEMBERS) {
      expect(screen.getByText(member.name)).toBeInTheDocument()
    }
  })

  it('toggles a member approval permission', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    const toggle = screen.getByRole('switch', { name: '김경민 승인 권한' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('shows a toast when a member approval permission is toggled', async () => {
    const user = userEvent.setup()
    render(
      <>
        <SettingsPage />
        <ToastViewport />
      </>,
    )

    await user.click(screen.getByRole('switch', { name: '김경민 승인 권한' }))

    expect(screen.getByText('김경민님의 승인 권한을 변경했습니다.')).toBeInTheDocument()
  })

  it('shows a toast when inviting a member', async () => {
    const user = userEvent.setup()
    render(
      <>
        <SettingsPage />
        <ToastViewport />
      </>,
    )

    await user.click(screen.getByRole('button', { name: '＋ 구성원 초대' }))

    expect(screen.getByText('구성원 초대를 보냈습니다.')).toBeInTheDocument()
  })

  it('switches to the security link tab and shows link history', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    const securityTab = screen.getByRole('tab', { name: SETTINGS_TABS[1] })
    await user.click(securityTab)

    expect(securityTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(SECURITY_LINK_HISTORY[0].workerName)).toBeInTheDocument()
    expect(screen.queryByText('구성원과 승인 권한')).not.toBeInTheDocument()
  })

  it('walks through the link reissue flow end to end', async () => {
    const user = userEvent.setup()
    render(
      <>
        <SettingsPage />
        <ToastViewport />
      </>,
    )

    await user.click(screen.getByRole('tab', { name: SETTINGS_TABS[1] }))
    await user.click(screen.getAllByRole('button', { name: '재발급' })[0])

    expect(screen.getByRole('dialog', { name: '보안 링크 재발급' })).toBeInTheDocument()
    expect(screen.getByText(`${SECURITY_LINK_HISTORY[0].workerName} · E-9`)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '새 링크 생성' }))

    expect(screen.getByRole('dialog', { name: '새 링크가 준비되었습니다' })).toBeInTheDocument()

    const closeButtons = screen.getAllByRole('button', { name: '닫기' })
    await user.click(closeButtons[closeButtons.length - 1])

    expect(screen.getByText('보안 링크를 재발급했습니다.')).toBeInTheDocument()
  })

  it('switches to the completion evidence tab', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    await user.click(screen.getByRole('tab', { name: SETTINGS_TABS[2] }))

    expect(screen.getByText(COMPLETION_EVIDENCE_RULES[0].caseType)).toBeInTheDocument()
  })

  it('switches to the process steps tab', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    await user.click(screen.getByRole('tab', { name: SETTINGS_TABS[3] }))

    expect(screen.getByText(PROCESS_STEP_RULES[0].approvalSteps)).toBeInTheDocument()
  })

  it('switches to the data log tab', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    await user.click(screen.getByRole('tab', { name: SETTINGS_TABS[4] }))

    expect(screen.getByText(DATA_LOG_SETTINGS[0].value)).toBeInTheDocument()
  })
})
