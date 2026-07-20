import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LinkRequestPage } from './LinkRequestPage'

describe('LinkRequestPage', () => {
  it('renders the request headline and deadline', () => {
    render(
      <MemoryRouter>
        <LinkRequestPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('마감 · 7월 24일 수요일')).toBeInTheDocument()
  })

  it('navigates to the upload page on confirmation', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/worker-portal']}>
        <Routes>
          <Route path="/worker-portal" element={<LinkRequestPage />} />
          <Route path="/worker-portal/upload" element={<p>upload screen</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: '안내를 확인했습니다' }))

    expect(screen.getByText('upload screen')).toBeInTheDocument()
  })
})
