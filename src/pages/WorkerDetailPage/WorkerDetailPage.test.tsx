import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { WorkerDetailPage } from './WorkerDetailPage'
import { WORKERS } from '../WorkerListPage/workerListData'

function renderPage(workerId: string) {
  render(
    <MemoryRouter initialEntries={[`/workers/${workerId}/detail`]}>
      <Routes>
        <Route path="/workers/:workerId/detail" element={<WorkerDetailPage />} />
        <Route path="/workers/:workerId" element={<p>근로자 목록</p>} />
        <Route path="/tasks/:caseId" element={<p>업무 상세</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('WorkerDetailPage', () => {
  it('renders basic profile info for the selected worker', () => {
    const worker = WORKERS[0]
    renderPage(worker.id)

    expect(screen.getByRole('heading', { name: worker.name })).toBeInTheDocument()
    expect(screen.getByText(worker.employeeId)).toBeInTheDocument()
    expect(screen.getByText(worker.phone)).toBeInTheDocument()
  })

  it('shows documents matched by worker name', () => {
    const worker = WORKERS.find((item) => item.name === '쩐티B')!
    renderPage(worker.id)

    expect(screen.getByText('표준근로계약서')).toBeInTheDocument()
  })

  it('shows an empty state when the worker has no matching documents', () => {
    const worker = WORKERS.find((item) => item.name !== '쩐티B' && item.name !== '수라즈C' && item.name !== '아흐메드D' && item.name !== '응웬반A')!
    renderPage(worker.id)

    expect(screen.getByText('제출된 서류가 없습니다')).toBeInTheDocument()
  })

  it('navigates to the task detail when opening a current task', async () => {
    const user = userEvent.setup()
    const worker = WORKERS[0]
    renderPage(worker.id)

    await user.click(screen.getAllByRole('button', { name: '열기 →' })[0])

    expect(await screen.findByText('업무 상세')).toBeInTheDocument()
  })

  it('falls back to the first worker when the workerId is invalid', () => {
    renderPage('does-not-exist')

    expect(screen.getByRole('heading', { name: WORKERS[0].name })).toBeInTheDocument()
  })
})
