import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WorkItemRow } from './WorkItemRow'

describe('WorkItemRow', () => {
  it('renders title, meta, next action, and fires onClick', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <WorkItemRow
        title="응웬반A 체류연장 준비"
        meta="D-12 · 승인 대기 · 담당 김민지"
        nextAction="다음 · 요청문 승인"
        onClick={onClick}
      />,
    )

    expect(screen.getByText('응웬반A 체류연장 준비')).toBeInTheDocument()
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
