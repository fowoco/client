import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Tabs } from './Tabs'

const TABS = [
  { id: 'all', label: '전체', count: 3 },
  { id: 'done', label: '완료' },
]

describe('Tabs', () => {
  it('renders every tab with its count when provided', () => {
    render(<Tabs tabs={TABS} activeId="all" onChange={vi.fn()} ariaLabel="테스트 탭" />)

    expect(screen.getByRole('tab', { name: '전체 3' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '완료' })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onChange with the clicked tab id', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Tabs tabs={TABS} activeId="all" onChange={onChange} ariaLabel="테스트 탭" />)

    await user.click(screen.getByRole('tab', { name: '완료' }))

    expect(onChange).toHaveBeenCalledWith('done')
  })

  it('links tab id/aria-controls to a panel when idPrefix is given', () => {
    render(<Tabs tabs={TABS} activeId="all" onChange={vi.fn()} ariaLabel="테스트 탭" idPrefix="demo" />)

    const tab = screen.getByRole('tab', { name: '전체 3' })
    expect(tab).toHaveAttribute('id', 'demo-tab-0')
    expect(tab).toHaveAttribute('aria-controls', 'demo-panel-0')
  })
})
