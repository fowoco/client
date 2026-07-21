import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { WorkerListPage } from './WorkerListPage'
import styles from './WorkerListPage.module.css'
import { WORKERS } from './workerListData'

function renderPage(demoState = 'success', initialPath = `/workers?demoState=${demoState}`) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/workers" element={<WorkerListPage />} />
        <Route path="/workers/:workerId" element={<WorkerListPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('WorkerListPage', () => {
  it('renders the first 5 priority worker rows and defaults to the first worker detail', () => {
    renderPage()

    for (const worker of WORKERS.slice(0, 5)) {
      expect(screen.getAllByText(worker.name).length).toBeGreaterThan(0)
    }
    expect(screen.queryByText(WORKERS[5].name)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: WORKERS[0].name })).toBeInTheDocument()
    expect(screen.getByText(WORKERS[0].currentTasks[0].title)).toBeInTheDocument()
  })

  it('shows every worker after clicking "전체 근로자 보기"', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '전체 근로자 보기 →' }))

    for (const worker of WORKERS) {
      expect(screen.getAllByText(worker.name).length).toBeGreaterThan(0)
    }
    expect(screen.queryByRole('button', { name: '전체 근로자 보기 →' })).not.toBeInTheDocument()
  })

  it('filters workers by search query', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('근로자 검색'), '네팔')

    await waitFor(() => {
      expect(screen.queryByText('쩐티B')).not.toBeInTheDocument()
    })
    expect(screen.getByText('수라즈C')).toBeInTheDocument()
  })

  it('shows an empty state when a search has no matches', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('근로자 검색'), '존재하지않는이름')

    expect(await screen.findByText('표시할 근로자가 없습니다')).toBeInTheDocument()
  })

  it('switches the detail panel when a different worker is selected', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /쩐티B/ }))

    expect(screen.getByRole('heading', { name: '쩐티B' })).toBeInTheDocument()
  })

  it('shows an empty state when a worker has no current tasks', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /아흐메드D/ }))

    expect(screen.getByText('진행 중인 업무가 없습니다.')).toBeInTheDocument()
  })

  it('shows a loading state', () => {
    renderPage('loading')
    expect(screen.getByText('근로자 목록을 불러오는 중입니다')).toBeInTheDocument()
  })

  it('shows an error state with a retry action', () => {
    renderPage('error')
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })

  it('renders the deep-linked worker as selected when visiting /workers/:workerId', () => {
    renderPage('success', `/workers/${WORKERS[1].id}?demoState=success`)

    expect(screen.getByRole('heading', { name: WORKERS[1].name })).toBeInTheDocument()
  })

  it('falls back to the first worker when the workerId is invalid', () => {
    renderPage('success', '/workers/does-not-exist?demoState=success')

    expect(screen.getByRole('heading', { name: WORKERS[0].name })).toBeInTheDocument()
  })

  it('filters workers when the deadline filter changes', async () => {
    const user = userEvent.setup()
    renderPage()

    const trigger = screen.getByRole('button', { name: '기한 필터' })
    expect(trigger).toHaveTextContent('기한 · 90일')

    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: '기한 · 30일' }))

    expect(trigger).toHaveTextContent('기한 · 30일')
    expect(screen.getAllByText('응웬반A').length).toBeGreaterThan(0)
    expect(screen.getByText('솜차이E')).toBeInTheDocument()
    expect(screen.queryByText('아흐메드D')).not.toBeInTheDocument()
  })

  it('colors the deadline text by urgency tier', () => {
    renderPage()

    const mediumWorker = WORKERS[1]
    const comfortableWorker = WORKERS.find((worker) => worker.deadlineDays === null)!

    expect(screen.getByText(mediumWorker.deadlineLabel)).toHaveClass(styles.workerDeadlineMedium)
    expect(screen.getByText(comfortableWorker.deadlineLabel)).toHaveClass(
      styles.workerDeadlineComfortable,
    )
  })
})
