import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlaceholderPage } from './PlaceholderPage'

describe('PlaceholderPage', () => {
  it('renders the title and issue link', () => {
    render(<PlaceholderPage title="로그인" issueUrl="https://github.com/fowoco/client/issues/5" />)

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://github.com/fowoco/client/issues/5',
    )
  })
})
