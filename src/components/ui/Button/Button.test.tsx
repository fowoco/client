import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders its label and fires onClick', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>업무 생성</Button>)

    await user.click(screen.getByRole('button', { name: '업무 생성' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>업무 생성</Button>)
    expect(screen.getByRole('button', { name: '업무 생성' })).toBeDisabled()
  })
})
