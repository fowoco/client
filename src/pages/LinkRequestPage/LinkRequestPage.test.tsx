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
  language: 'vi',
  due_date: '2026-08-10',
  requested_document_types: ['PASSPORT_COPY', 'CONTRACT'],
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
    expect(screen.getByText('베트남어 안내')).toBeInTheDocument()
    expect(screen.getByText('제출할 서류 2개')).toBeInTheDocument()
    expect(screen.getByText('근로계약서')).toBeInTheDocument()
  })

  it('shows a retryable preparing state for a link without ready draft content', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          timestamp: '2026-08-08T00:00:00Z',
          status: 409,
          code: 'WORKER_LINK_CONTENT_NOT_READY',
          message: '근로자에게 표시할 요청 안내가 아직 준비되지 않았습니다.',
          path: '/api/v1/public/worker-links/token-1',
          request_id: 'request-1',
          field_errors: [],
        },
        409,
      ),
    )
    render(
      <MemoryRouter initialEntries={['/worker-portal/token-1']}>
        <Routes>
          <Route path="/worker-portal/:token" element={<LinkRequestPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('요청 내용을 준비하고 있습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
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

    expect(await screen.findByText('upload screen')).toBeInTheDocument()
    const responseCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).endsWith('/responses'))
    expect(JSON.parse(responseCall?.[1]?.body as string)).toMatchObject({
      response_type: 'ACKNOWLEDGED',
    })
  })

  it('sends the question text instead of only a question type', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockImplementation((input) => {
      if (String(input).endsWith('/responses')) {
        return Promise.resolve(
          jsonResponse({ response_id: 'R-1', received_at: '2026-08-10T00:00:00Z' }, 201),
        )
      }
      return Promise.resolve(jsonResponse(VIEW))
    })
    render(
      <MemoryRouter initialEntries={['/worker-portal/token-1']}>
        <Routes>
          <Route path="/worker-portal/:token" element={<LinkRequestPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: '질문이 있습니다' }))
    await user.type(
      screen.getByLabelText('담당자에게 물어볼 내용'),
      '여권 어느 면을 찍어야 하나요?',
    )
    await user.click(screen.getByRole('button', { name: '질문 보내기' }))

    expect(await screen.findByText('담당자에게 질문을 전송했습니다.')).toBeInTheDocument()
    const responseCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).endsWith('/responses'))
    expect(JSON.parse(String(responseCall?.[1]?.body))).toMatchObject({
      response_type: 'QUESTION',
      message: '여권 어느 면을 찍어야 하나요?',
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
