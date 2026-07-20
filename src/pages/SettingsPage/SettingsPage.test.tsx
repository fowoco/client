import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SettingsPage } from './SettingsPage'
import { MEMBERS, SETTINGS_TABS } from './settingsData'

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

    const toggle = screen.getByRole('switch', { name: '김민지 승인 권한' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('switches the active settings tab', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    const securityTab = screen.getByRole('tab', { name: SETTINGS_TABS[1] })
    await user.click(securityTab)

    expect(securityTab).toHaveAttribute('aria-selected', 'true')
  })
})
