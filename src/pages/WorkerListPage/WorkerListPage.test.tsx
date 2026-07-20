import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { WorkerListPage } from './WorkerListPage'
import { WORKERS } from './workerListData'

describe('WorkerListPage', () => {
  it('renders every worker row and defaults to the first worker detail', () => {
    render(<WorkerListPage />)

    for (const worker of WORKERS) {
      expect(screen.getAllByText(worker.name).length).toBeGreaterThan(0)
    }
    expect(screen.getByRole('heading', { name: WORKERS[0].name })).toBeInTheDocument()
    expect(screen.getByText(WORKERS[0].currentTasks[0].title)).toBeInTheDocument()
  })

  it('filters workers by search query', async () => {
    const user = userEvent.setup()
    render(<WorkerListPage />)

    await user.type(screen.getByLabelText('근로자 검색'), '네팔')

    expect(screen.getByText('수라즈C')).toBeInTheDocument()
    expect(screen.queryByText('쩐티B')).not.toBeInTheDocument()
  })

  it('switches the detail panel when a different worker is selected', async () => {
    const user = userEvent.setup()
    render(<WorkerListPage />)

    await user.click(screen.getByRole('button', { name: /쩐티B/ }))

    expect(screen.getByRole('heading', { name: '쩐티B' })).toBeInTheDocument()
  })

  it('shows an empty state when a worker has no current tasks', async () => {
    const user = userEvent.setup()
    render(<WorkerListPage />)

    await user.click(screen.getByRole('button', { name: /아흐메드D/ }))

    expect(screen.getByText('진행 중인 업무가 없습니다.')).toBeInTheDocument()
  })
})
