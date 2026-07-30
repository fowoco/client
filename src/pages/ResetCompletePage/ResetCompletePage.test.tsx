import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ResetCompletePage } from './ResetCompletePage'

describe('ResetCompletePage', () => {
  it('renders the success message and a link back to login', () => {
    render(
      <MemoryRouter>
        <ResetCompletePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('비밀번호가 변경되었습니다')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '로그인하기' })).toHaveAttribute('href', '/login')
  })
})
