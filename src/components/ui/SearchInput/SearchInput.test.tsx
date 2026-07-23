import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  it('renders the placeholder, value, and accessible label', () => {
    render(
      <SearchInput value="응웬" onChange={vi.fn()} placeholder="이름 검색" ariaLabel="근로자 검색" />,
    )

    const input = screen.getByLabelText('근로자 검색')
    expect(input).toHaveValue('응웬')
    expect(input).toHaveAttribute('placeholder', '이름 검색')
  })

  it('calls onChange with the new value when typed into', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} placeholder="검색" ariaLabel="검색" />)

    await user.type(screen.getByLabelText('검색'), 'a')

    expect(onChange).toHaveBeenCalledWith('a')
  })
})
