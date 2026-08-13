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

beforeEach(() => {
  window.sessionStorage.clear()
  vi.stubGlobal('fetch', vi.fn())
})
afterEach(() => {
  window.sessionStorage.clear()
  vi.unstubAllGlobals()
})

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

    await user.click(await screen.findByRole('button', { name: '서류 제출 화면으로 이동' }))

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

  it('renders only requested answer fields and submits structured answers', async () => {
    const user = userEvent.setup()
    let submitted = false
    vi.mocked(fetch).mockImplementation((input) => {
      if (String(input).endsWith('/responses')) {
        submitted = true
        return Promise.resolve(
          jsonResponse({ response_id: 'R-answers', received_at: '2026-08-13T00:00:00Z' }, 201),
        )
      }
      return Promise.resolve(
        jsonResponse({
          ...VIEW,
          requested_document_types: [],
          allowed_responses: ['SLOT_ANSWERS_SUBMITTED'],
          requested_actions: submitted
            ? []
            : [
                {
                  type: 'ANSWER_FIELD',
                  field_key: 'lodging',
                  label: '현재 숙소 제공 조건을 입력해 주세요.',
                  input_type: 'TEXT',
                  required: true,
                  document_type: null,
                },
                {
                  type: 'ANSWER_FIELD',
                  field_key: 'accommodation_provided',
                  label: '사업장에서 숙소를 제공받고 있나요?',
                  input_type: 'BOOLEAN',
                  required: true,
                  document_type: null,
                },
                {
                  type: 'ANSWER_FIELD',
                  field_key: 'accommodation_cost',
                  label: '매월 부담하는 숙소 비용을 입력해 주세요.',
                  input_type: 'MONEY',
                  required: true,
                  document_type: null,
                },
              ],
        }),
      )
    })

    const { unmount } = render(
      <MemoryRouter initialEntries={['/worker-portal/token-1']}>
        <Routes>
          <Route path="/worker-portal/:token" element={<LinkRequestPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(
      await screen.findByLabelText(/현재 숙소 제공 조건을 입력해 주세요/),
      '사업장 건물 숙소 제공',
    )
    await user.click(screen.getByRole('radio', { name: '예' }))
    await user.type(screen.getByLabelText(/매월 부담하는 숙소 비용을 입력해 주세요/), '300,000')
    expect(screen.queryByLabelText(/여권번호/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '답변 제출' }))

    expect(await screen.findByText('답변 제출 · 처리 중')).toBeInTheDocument()
    expect(screen.getByText(/아직 업무가 완료된 것은 아닙니다/)).toBeInTheDocument()
    const responseCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([url]) => String(url).endsWith('/responses'))
    expect(responseCalls).toHaveLength(1)
    expect(JSON.parse(String(responseCalls[0][1]?.body))).toEqual({
      response_type: 'SLOT_ANSWERS_SUBMITTED',
      answers: {
        lodging: '사업장 건물 숙소 제공',
        accommodation_provided: 'true',
        accommodation_cost: '300000',
      },
      idempotency_key: expect.any(String),
    })

    unmount()
    render(
      <MemoryRouter initialEntries={['/worker-portal/token-1']}>
        <Routes>
          <Route path="/worker-portal/:token" element={<LinkRequestPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('답변 제출 · 처리 중')).toBeInTheDocument()
    expect(
      vi.mocked(fetch).mock.calls.filter(([url]) => String(url).endsWith('/responses')),
    ).toHaveLength(1)
  })

  it.each([
    [409, 'WORKER_RESPONSE_IDEMPOTENCY_CONFLICT', '이전 제출 요청과 내용이 달라'],
    [422, 'WORKER_SLOT_ANSWER_INVALID', '요청된 형식과 맞지 않는 답변'],
  ])('shows a recoverable message for a %i answer error', async (status, code, message) => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockImplementation((input) => {
      if (String(input).endsWith('/responses')) {
        return Promise.resolve(
          jsonResponse(
            {
              timestamp: '2026-08-13T00:00:00Z',
              status,
              code,
              message: 'server error',
              path: '/api/v1/public/worker-links/token-1/responses',
              request_id: 'request-1',
              field_errors: [],
            },
            status,
          ),
        )
      }
      return Promise.resolve(
        jsonResponse({
          ...VIEW,
          requested_document_types: [],
          allowed_responses: ['SLOT_ANSWERS_SUBMITTED'],
          requested_actions: [
            {
              type: 'ANSWER_FIELD',
              field_key: 'lodging',
              label: '숙소 제공 조건',
              input_type: 'TEXT',
              required: true,
              document_type: null,
            },
          ],
        }),
      )
    })
    render(
      <MemoryRouter initialEntries={['/worker-portal/token-1']}>
        <Routes>
          <Route path="/worker-portal/:token" element={<LinkRequestPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(await screen.findByLabelText(/숙소 제공 조건/), '기숙사')
    await user.click(screen.getByRole('button', { name: '답변 제출' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('button', { name: '답변 제출' })).toBeEnabled()
  })

  it('reuses the same idempotency key when an answer submission is retried', async () => {
    const user = userEvent.setup()
    let responseAttempts = 0
    vi.mocked(fetch).mockImplementation((input) => {
      if (String(input).endsWith('/responses')) {
        responseAttempts += 1
        if (responseAttempts === 1) return Promise.reject(new TypeError('network failed'))
        return Promise.resolve(
          jsonResponse({ response_id: 'R-retry', received_at: '2026-08-13T00:00:00Z' }, 201),
        )
      }
      return Promise.resolve(
        jsonResponse({
          ...VIEW,
          requested_document_types: [],
          allowed_responses: ['SLOT_ANSWERS_SUBMITTED'],
          requested_actions: [
            {
              type: 'ANSWER_FIELD',
              field_key: 'lodging',
              label: '숙소 제공 조건',
              input_type: 'TEXT',
              required: true,
              document_type: null,
            },
          ],
        }),
      )
    })
    render(
      <MemoryRouter initialEntries={['/worker-portal/token-1']}>
        <Routes>
          <Route path="/worker-portal/:token" element={<LinkRequestPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(await screen.findByLabelText(/숙소 제공 조건/), '기숙사 제공')
    await user.click(screen.getByRole('button', { name: '답변 제출' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('네트워크 상태를 확인')
    await user.click(screen.getByRole('button', { name: '답변 제출' }))

    expect(await screen.findByText('답변 제출 · 처리 중')).toBeInTheDocument()
    const responseBodies = vi
      .mocked(fetch)
      .mock.calls.filter(([url]) => String(url).endsWith('/responses'))
      .map(([, init]) => JSON.parse(String(init?.body)))
    expect(responseBodies).toHaveLength(2)
    expect(responseBodies[0].idempotency_key).toBe(responseBodies[1].idempotency_key)
  })

  it('moves an expired worker link to the expired screen', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          timestamp: '2026-08-13T00:00:00Z',
          status: 410,
          code: 'WORKER_LINK_EXPIRED',
          message: '만료된 링크입니다.',
          path: '/api/v1/public/worker-links/token-1',
          request_id: 'request-1',
          field_errors: [],
        },
        410,
      ),
    )
    render(
      <MemoryRouter initialEntries={['/worker-portal/token-1']}>
        <Routes>
          <Route path="/worker-portal/:token" element={<LinkRequestPage />} />
          <Route path="/worker-portal/:token/expired" element={<p>expired screen</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('expired screen')).toBeInTheDocument()
  })
})
