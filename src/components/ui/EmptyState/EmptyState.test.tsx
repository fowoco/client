import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders title, body, and action, and fires onAction', async () => {
    const onAction = vi.fn()
    const user = userEvent.setup()
    render(
      <EmptyState
        title="처리할 업무가 없습니다"
        body="새 요청을 입력하거나 파일을 가져와 업무를 만들어 보세요."
        actionLabel="업무 만들기"
        onAction={onAction}
      />,
    )

    expect(screen.getByText('처리할 업무가 없습니다')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '업무 만들기' }))
    expect(onAction).toHaveBeenCalledOnce()
  })
})
