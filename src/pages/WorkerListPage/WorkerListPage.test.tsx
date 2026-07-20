import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { WorkerListPage } from './WorkerListPage'
import { WORKERS } from './workerData'

function renderPage() {
  render(
    <MemoryRouter>
      <WorkerListPage />
    </MemoryRouter>,
  )
}

describe('WorkerListPage', () => {
  it('renders every worker card', () => {
    renderPage()
    for (const worker of WORKERS) {
      expect(screen.getByText(worker.name)).toBeInTheDocument()
    }
  })

  it('filters workers by search query', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByPlaceholderText('이름, 국적, 담당 라인으로 검색'), '베트남')

    expect(screen.getByText('응우옌 반 안')).toBeInTheDocument()
    expect(screen.queryByText('수산토')).not.toBeInTheDocument()
  })

  it('toggles a worker checkbox selection', async () => {
    const user = userEvent.setup()
    renderPage()

    const checkbox = screen.getAllByRole('checkbox')[0]
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)

    expect(checkbox).toBeChecked()
  })
})
