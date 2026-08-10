import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WorkItemRow } from './WorkItemRow'

describe('WorkItemRow', () => {
  it('renders HR decision context and keeps evidence and next action separate', async () => {
    const onClick = vi.fn()
    const onEvidenceClick = vi.fn()
    const user = userEvent.setup()
    render(
      <WorkItemRow
        workerLabel="응웬반A"
        title="응웬반A 체류연장 준비"
        statusLabel="승인 대기"
        detailItems={['처리 기한 2026.08.17 · D-7']}
        nextActor="담당자"
        nextAction="승인 검토"
        onClick={onClick}
        onEvidenceClick={onEvidenceClick}
      />,
    )

    expect(screen.getByText('응웬반A 체류연장 준비')).toBeInTheDocument()
    expect(screen.getByText('처리 기한 2026.08.17 · D-7')).toBeInTheDocument()
    expect(screen.getByText('담당자')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '근거 보기' }))
    expect(onEvidenceClick).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: '승인 검토' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
