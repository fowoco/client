import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ListRow } from './ListRow'

describe('ListRow', () => {
  it('renders children and applies the given column template', () => {
    render(
      <ListRow columns="120px 1fr 140px">
        <span>내용</span>
      </ListRow>,
    )

    const row = screen.getByText('내용').parentElement as HTMLElement
    expect(row).toHaveStyle({ gridTemplateColumns: '120px 1fr 140px' })
  })
})
