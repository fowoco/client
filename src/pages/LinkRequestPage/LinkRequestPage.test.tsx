import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LinkRequestPage } from './LinkRequestPage'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const VIEW = {
  guidance: '여권 사진면 사본을 제출해 주세요.',
  due_date: '2026-08-10',
  allowed_responses: ['ACKNOWLEDGED', 'QUESTION', 'DOCUMENT_SUBMITTED'],
}

beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
afterEach(() => vi.unstubAllGlobals())

describe('LinkRequestPage', () => {
  it('renders guidance loaded from the public token API', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(VIEW))
    render(
      <MemoryRouter initialEntries={['/worker-portal/token-1']}>
        <Routes>
          <Route path="/worker-portal/:token" element={<LinkRequestPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('여권 사진면 사본을 제출해 주세요.')).toBeInTheDocument()
    expect(screen.getByText(/2026.08.10/)).toBeInTheDocument()
  })

  it('keeps the token when navigating to the upload page', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockImplementation(() => Promise.resolve(jsonResponse(VIEW)))
    render(
      <MemoryRouter initialEntries={['/worker-portal/token-1']}>
        <Routes>
          <Route path="/worker-portal/:token" element={<LinkRequestPage />} />
          <Route path="/worker-portal/:token/upload" element={<p>upload screen</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: '안내를 확인했습니다' }))

    expect(screen.getByText('upload screen')).toBeInTheDocument()
    const responseCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).endsWith('/responses'))
    expect(JSON.parse(responseCall?.[1]?.body as string)).toMatchObject({
      response_type: 'ACKNOWLEDGED',
    })
  })

  it('shows an explicit state when opened without a token', () => {
    render(
      <MemoryRouter initialEntries={['/worker-portal']}>
        <Routes>
          <Route path="/worker-portal" element={<LinkRequestPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('제출 링크가 필요합니다')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })
})
