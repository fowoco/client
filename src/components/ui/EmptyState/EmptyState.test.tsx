import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState } from './EmptyState'
import styles from './EmptyState.module.css'

describe('EmptyState', () => {
  it('applies the pulse animation class only for the loading kind', () => {
    const { rerender } = render(<EmptyState kind="loading" title="불러오는 중" body="잠시만 기다려 주세요." />)
    expect(screen.getByText('불러오는 중').parentElement).toHaveClass(styles.loading)

    rerender(<EmptyState kind="empty" title="없음" body="비어 있습니다." />)
    expect(screen.getByText('없음').parentElement).not.toHaveClass(styles.loading)
  })

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
