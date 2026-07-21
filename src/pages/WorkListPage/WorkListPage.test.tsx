import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import railStyles from '../../components/ui/WorkItemRow/WorkItemRow.module.css'
import { WorkListPage } from './WorkListPage'
import { WORK_ITEMS, WORK_TABS } from './workListData'

function renderPage(demoState = 'success') {
  render(
    <MemoryRouter initialEntries={[`/tasks?demoState=${demoState}`]}>
      <WorkListPage />
    </MemoryRouter>,
  )
}

describe('WorkListPage', () => {
  it('renders every tab and the first 5 priority work items', () => {
    renderPage()

    for (const tab of WORK_TABS) {
      expect(screen.getByRole('tab', { name: `${tab.label} ${tab.count}` })).toBeInTheDocument()
    }
    for (const item of WORK_ITEMS.slice(0, 5)) {
      expect(screen.getByText(item.title)).toBeInTheDocument()
    }
    expect(screen.queryByText(WORK_ITEMS[5].title)).not.toBeInTheDocument()
  })

  it('shows every work item after clicking "전체 업무 보기"', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '전체 업무 보기 →' }))

    for (const item of WORK_ITEMS) {
      expect(screen.getByText(item.title)).toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: '전체 업무 보기 →' })).not.toBeInTheDocument()
  })

  it('filters work items by search query', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('업무 검색'), '기숙사')

    expect(screen.getByText('월간 기숙사 점검 결과 정리')).toBeInTheDocument()
    expect(screen.queryByText('응웬반A 체류연장 준비')).not.toBeInTheDocument()
  })

  it('shows an empty state when a search has no matches', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('업무 검색'), '존재하지않는검색어')

    expect(screen.getByText('표시할 업무가 없습니다')).toBeInTheDocument()
  })

  it('filters work items when a different tab is selected', async () => {
    const user = userEvent.setup()
    renderPage()

    const mineTab = screen.getByRole('tab', { name: '내 업무 8' })
    await user.click(mineTab)

    expect(mineTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('응웬반A 체류연장 준비')).toBeInTheDocument()
    expect(screen.queryByText('월간 기숙사 점검 결과 정리')).not.toBeInTheDocument()
  })

  it('filters work items when the follow-up tab is selected', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: '후속조치 3' }))

    expect(screen.getByText('월간 기숙사 점검 결과 정리')).toBeInTheDocument()
    expect(screen.queryByText('응웬반A 체류연장 준비')).not.toBeInTheDocument()
  })

  it('shows a loading state', () => {
    renderPage('loading')
    expect(screen.getByText('업무 목록을 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an error state with a retry action', () => {
    renderPage('error')
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })

  it('filters work items when the status filter changes', async () => {
    const user = userEvent.setup()
    renderPage()

    const trigger = screen.getByRole('button', { name: '상태 필터' })
    expect(trigger).toHaveTextContent('상태 · 전체')

    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: '상태 · 승인 대기' }))

    expect(trigger).toHaveTextContent('상태 · 승인 대기')
    expect(screen.getByText('응웬반A 체류연장 준비')).toBeInTheDocument()
    expect(screen.queryByText('외국인등록증 사본 제출 요청')).not.toBeInTheDocument()
  })

  it('filters work items when the due filter changes', async () => {
    const user = userEvent.setup()
    renderPage()

    const trigger = screen.getByRole('button', { name: '마감 필터' })

    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: '마감 · 7일' }))

    expect(screen.getByText('7월 외부기관 제출자료 취합')).toBeInTheDocument()
    expect(screen.queryByText('응웬반A 체류연장 준비')).not.toBeInTheDocument()
  })

  it('colors the rail by urgency tier derived from dueDays', () => {
    renderPage()

    const urgentItem = WORK_ITEMS.find((item) => item.dueDays <= 7)!
    const mediumItem = WORK_ITEMS.find((item) => item.dueDays > 7)!

    const urgentRail = screen.getByText(urgentItem.title).closest('button')!.querySelector('[aria-hidden="true"]')
    const mediumRail = screen.getByText(mediumItem.title).closest('button')!.querySelector('[aria-hidden="true"]')

    expect(urgentRail).toHaveClass(railStyles.railCritical)
    expect(mediumRail).not.toHaveClass(railStyles.railCritical)
    expect(mediumRail).not.toHaveClass(railStyles.railNeutral)
  })
})
