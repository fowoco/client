import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Dropdown } from './Dropdown'

const OPTIONS = [
  { value: '30', label: '마감 · 30일' },
  { value: '60', label: '마감 · 60일' },
  { value: '90', label: '마감 · 90일' },
]

describe('Dropdown', () => {
  it('shows the selected option label on the trigger and hides the list initially', () => {
    render(<Dropdown options={OPTIONS} value="30" onChange={() => {}} ariaLabel="마감 필터" />)

    expect(screen.getByRole('button', { name: '마감 필터' })).toHaveTextContent('마감 · 30일')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('opens the list on click and calls onChange when an option is selected', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Dropdown options={OPTIONS} value="30" onChange={onChange} ariaLabel="마감 필터" />)

    await user.click(screen.getByRole('button', { name: '마감 필터' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: '마감 · 90일' }))
    expect(onChange).toHaveBeenCalledWith('90')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes the list when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Dropdown options={OPTIONS} value="30" onChange={() => {}} ariaLabel="마감 필터" />
        <button type="button">outside</button>
      </div>,
    )

    await user.click(screen.getByRole('button', { name: '마감 필터' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'outside' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes the list on Escape', async () => {
    const user = userEvent.setup()
    render(<Dropdown options={OPTIONS} value="30" onChange={() => {}} ariaLabel="마감 필터" />)

    await user.click(screen.getByRole('button', { name: '마감 필터' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('returns focus to the trigger after selecting an option', async () => {
    const user = userEvent.setup()
    render(<Dropdown options={OPTIONS} value="30" onChange={() => {}} ariaLabel="마감 필터" />)

    const trigger = screen.getByRole('button', { name: '마감 필터' })
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: '마감 · 90일' }))

    expect(trigger).toHaveFocus()
  })

  it('returns focus to the trigger after closing with Escape', async () => {
    const user = userEvent.setup()
    render(<Dropdown options={OPTIONS} value="30" onChange={() => {}} ariaLabel="마감 필터" />)

    const trigger = screen.getByRole('button', { name: '마감 필터' })
    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
  })

  it('sets aria-activedescendant to the currently active option', async () => {
    const user = userEvent.setup()
    render(<Dropdown options={OPTIONS} value="30" onChange={() => {}} ariaLabel="마감 필터" />)

    await user.click(screen.getByRole('button', { name: '마감 필터' }))
    const list = screen.getByRole('listbox')
    const selectedOption = screen.getByRole('option', { name: '마감 · 30일' })

    expect(list).toHaveAttribute('aria-activedescendant', selectedOption.id)
  })

  it('applies a custom width when provided', () => {
    render(
      <Dropdown options={OPTIONS} value="30" onChange={() => {}} ariaLabel="마감 필터" width="260px" />,
    )

    const trigger = screen.getByRole('button', { name: '마감 필터' })
    expect(trigger.parentElement).toHaveStyle({ width: '260px' })
  })
})
