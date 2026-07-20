import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { WorkListPage } from './WorkListPage'
import { WORK_ITEMS, WORK_TABS } from './workListData'

describe('WorkListPage', () => {
  it('renders every tab and work item', () => {
    render(<WorkListPage />)

    for (const tab of WORK_TABS) {
      expect(screen.getByRole('tab', { name: `${tab.label} ${tab.count}` })).toBeInTheDocument()
    }
    for (const item of WORK_ITEMS) {
      expect(screen.getByText(item.title)).toBeInTheDocument()
    }
  })

  it('filters work items by search query', async () => {
    const user = userEvent.setup()
    render(<WorkListPage />)

    await user.type(screen.getByLabelText('업무 검색'), '기숙사')

    expect(screen.getByText('월간 기숙사 점검 결과 정리')).toBeInTheDocument()
    expect(screen.queryByText('응웬반A 체류연장 준비')).not.toBeInTheDocument()
  })

  it('switches the active tab on click', async () => {
    const user = userEvent.setup()
    render(<WorkListPage />)

    const mineTab = screen.getByRole('tab', { name: '내 업무 8' })
    await user.click(mineTab)

    expect(mineTab).toHaveAttribute('aria-selected', 'true')
  })
})
