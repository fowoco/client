import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SettingsPage } from './SettingsPage'
import {
  COMPLETION_EVIDENCE_RULES,
  DATA_LOG_SETTINGS,
  MEMBERS,
  PROCESS_STEP_RULES,
  SECURITY_LINK_HISTORY,
  SETTINGS_TABS,
} from './settingsData'

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

  it('switches to the security link tab and shows link history', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    const securityTab = screen.getByRole('tab', { name: SETTINGS_TABS[1] })
    await user.click(securityTab)

    expect(securityTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(SECURITY_LINK_HISTORY[0].workerName)).toBeInTheDocument()
    expect(screen.queryByText('구성원과 승인 권한')).not.toBeInTheDocument()
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
