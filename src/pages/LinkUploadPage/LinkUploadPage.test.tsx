import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LinkUploadPage } from './LinkUploadPage'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/worker-portal/token-1/upload']}>
      <Routes>
        <Route path="/worker-portal/:token/upload" element={<LinkUploadPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input) => {
      const url = String(input)
      if (url.endsWith('/documents')) {
        return Promise.resolve(
          jsonResponse(
            {
              upload_id: 'U-1',
              file_name: 'passport.jpg',
              size: 8,
              expires_at: '2026-08-07T00:00:00Z',
            },
            201,
          ),
        )
      }
      if (url.endsWith('/responses')) {
        return Promise.resolve(
          jsonResponse({ response_id: 'R-1', received_at: '2026-08-04T00:00:00Z' }, 201),
        )
      }
      return Promise.resolve(
        jsonResponse({
          guidance: '여권 사본을 제출해 주세요.',
          language: 'ko',
          due_date: '2026-08-10',
          requested_document_types: ['PASSPORT_COPY'],
          allowed_responses: ['QUESTION', 'NOT_UNDERSTOOD', 'DIFFICULT', 'DOCUMENT_SUBMITTED'],
        }),
      )
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('LinkUploadPage', () => {
  it('shows the real selected file without pretending it was uploaded', async () => {
    const user = userEvent.setup()
    renderPage()
    const file = new File(['passport'], 'passport_photo.jpg', { type: 'image/jpeg' })

    await user.upload(await screen.findByLabelText('여권 사본 제출할 파일 선택'), file)

    expect(screen.getByText('passport_photo.jpg')).toBeInTheDocument()
    expect(screen.getByText(/제출 전/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '서류 제출' })).toBeEnabled()
  })

  it('removes the selected file', async () => {
    const user = userEvent.setup()
    renderPage()
    const file = new File(['passport'], 'passport_photo.jpg', { type: 'image/jpeg' })

    await user.upload(await screen.findByLabelText('여권 사본 제출할 파일 선택'), file)
    await user.click(screen.getByRole('button', { name: '제거' }))

    expect(screen.queryByText('passport_photo.jpg')).not.toBeInTheDocument()
  })

  it('rejects unsupported file types', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderPage()
    const file = new File(['script'], 'worker.exe', { type: 'application/octet-stream' })

    await user.upload(await screen.findByLabelText('여권 사본 제출할 파일 선택'), file)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'JPG, PNG, WEBP, PDF 파일만 선택할 수 있습니다.',
    )
    expect(screen.queryByText('worker.exe')).not.toBeInTheDocument()
  })

  it('uploads the selected file and submits the upload id as a worker response', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: '요청받은 서류를 추가해 주세요' })
    const file = new File(['passport'], 'passport_photo.jpg', { type: 'image/jpeg' })

    await user.upload(await screen.findByLabelText('여권 사본 제출할 파일 선택'), file)
    await user.click(screen.getByRole('button', { name: '서류 제출' }))

    expect(await screen.findByText('서류를 제출했습니다')).toBeInTheDocument()
    const calls = vi.mocked(fetch).mock.calls
    expect(calls.some(([url]) => String(url).endsWith('/documents'))).toBe(true)
    const uploadCall = calls.find(([url]) => String(url).endsWith('/documents'))
    expect((uploadCall?.[1]?.body as FormData).get('documentType')).toBe('PASSPORT_COPY')
    const responseCall = calls.find(([url]) => String(url).endsWith('/responses'))
    expect(JSON.parse(responseCall?.[1]?.body as string)).toMatchObject({
      response_type: 'DOCUMENT_SUBMITTED',
      upload_ids: ['U-1'],
    })
  })

  it('uploads every requested document with its type before submitting one response', async () => {
    const user = userEvent.setup()
    let uploadCount = 0
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith('/documents')) {
        uploadCount += 1
        return Promise.resolve(
          jsonResponse(
            {
              upload_id: `U-${uploadCount}`,
              file_name: `document-${uploadCount}.jpg`,
              size: 8,
              expires_at: '2026-08-07T00:00:00Z',
            },
            201,
          ),
        )
      }
      if (url.endsWith('/responses')) {
        return Promise.resolve(
          jsonResponse(
            {
              response_id: 'R-1',
              received_at: '2026-08-04T00:00:00Z',
            },
            201,
          ),
        )
      }
      return Promise.resolve(
        jsonResponse({
          guidance: '여권과 계약서를 제출해 주세요.',
          language: 'ko',
          due_date: '2026-08-10',
          requested_document_types: ['PASSPORT_COPY', 'CONTRACT'],
          allowed_responses: ['DOCUMENT_SUBMITTED'],
        }),
      )
    })
    renderPage()

    await user.upload(
      await screen.findByLabelText('여권 사본 제출할 파일 선택'),
      new File(['passport'], 'passport.jpg', { type: 'image/jpeg' }),
    )
    await user.upload(
      screen.getByLabelText('근로계약서 제출할 파일 선택'),
      new File(['contract'], 'contract.pdf', { type: 'application/pdf' }),
    )
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '서류 제출' }))

    expect(await screen.findByText('서류를 제출했습니다')).toBeInTheDocument()
    const calls = vi.mocked(fetch).mock.calls
    const uploadTypes = calls
      .filter(([url]) => String(url).endsWith('/documents'))
      .map(([, init]) => (init?.body as FormData).get('documentType'))
    expect(uploadTypes).toEqual(['PASSPORT_COPY', 'CONTRACT'])
    const responseCall = calls.find(([url]) => String(url).endsWith('/responses'))
    expect(JSON.parse(String(responseCall?.[1]?.body))).toMatchObject({
      response_type: 'DOCUMENT_SUBMITTED',
      upload_ids: ['U-1', 'U-2'],
    })
  })

  it('uses UPLOAD_DOCUMENT actions from the worker link contract', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith('/documents')) {
        return Promise.resolve(
          jsonResponse(
            {
              upload_id: 'U-arc',
              file_name: 'arc.jpg',
              size: 8,
              expires_at: '2026-08-13T00:00:00Z',
            },
            201,
          ),
        )
      }
      if (url.endsWith('/responses')) {
        return Promise.resolve(
          jsonResponse({ response_id: 'R-arc', received_at: '2026-08-13T00:00:00Z' }, 201),
        )
      }
      return Promise.resolve(
        jsonResponse({
          guidance: '외국인등록증을 제출해 주세요.',
          language: 'ko',
          due_date: '2026-08-20',
          requested_document_types: [],
          allowed_responses: ['DOCUMENT_SUBMITTED'],
          requested_actions: [
            {
              type: 'UPLOAD_DOCUMENT',
              field_key: null,
              label: '외국인등록증 파일을 제출해 주세요.',
              input_type: null,
              required: true,
              document_type: 'ARC',
            },
          ],
        }),
      )
    })
    renderPage()

    await user.upload(
      await screen.findByLabelText('외국인등록증 제출할 파일 선택'),
      new File(['arc'], 'arc.jpg', { type: 'image/jpeg' }),
    )
    await user.click(screen.getByRole('button', { name: '서류 제출' }))

    expect(await screen.findByText('서류를 제출했습니다')).toBeInTheDocument()
    const uploadCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).endsWith('/documents'))
    expect((uploadCall?.[1]?.body as FormData).get('documentType')).toBe('ARC')
  })

  it('reuses uploaded files and the response idempotency key after a network retry', async () => {
    const user = userEvent.setup()
    let responseAttempts = 0
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith('/documents')) {
        return Promise.resolve(
          jsonResponse(
            {
              upload_id: 'U-1',
              file_name: 'passport.jpg',
              size: 8,
              expires_at: '2026-08-07T00:00:00Z',
            },
            201,
          ),
        )
      }
      if (url.endsWith('/responses')) {
        responseAttempts += 1
        if (responseAttempts === 1) return Promise.reject(new TypeError('network failed'))
        return Promise.resolve(
          jsonResponse(
            {
              response_id: 'R-1',
              received_at: '2026-08-04T00:00:00Z',
            },
            201,
          ),
        )
      }
      return Promise.resolve(
        jsonResponse({
          guidance: '여권을 제출해 주세요.',
          language: 'ko',
          due_date: '2026-08-10',
          requested_document_types: ['PASSPORT_COPY'],
          allowed_responses: ['DOCUMENT_SUBMITTED'],
        }),
      )
    })
    renderPage()
    await user.upload(
      await screen.findByLabelText('여권 사본 제출할 파일 선택'),
      new File(['passport'], 'passport.jpg', { type: 'image/jpeg' }),
    )

    await user.click(screen.getByRole('button', { name: '서류 제출' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('네트워크 상태를 확인')
    await user.click(screen.getByRole('button', { name: '서류 제출' }))

    expect(await screen.findByText('서류를 제출했습니다')).toBeInTheDocument()
    const calls = vi.mocked(fetch).mock.calls
    expect(calls.filter(([url]) => String(url).endsWith('/documents'))).toHaveLength(1)
    const responseCalls = calls.filter(([url]) => String(url).endsWith('/responses'))
    expect(responseCalls).toHaveLength(2)
    const responseBodies = responseCalls.map(([, init]) => JSON.parse(String(init?.body)))
    expect(responseBodies[0].idempotency_key).toBe(responseBodies[1].idempotency_key)
  })

  it('lets the worker write and submit the actual question', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /질문이 있습니다/ }))
    await user.type(
      screen.getByLabelText('담당자에게 물어볼 내용'),
      '계약서도 사진으로 보내도 되나요?',
    )
    await user.click(screen.getByRole('button', { name: '질문 보내기' }))

    expect(await screen.findByText('담당자에게 질문을 전송했습니다.')).toBeInTheDocument()
    const responseCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).endsWith('/responses'))
    expect(JSON.parse(String(responseCall?.[1]?.body))).toMatchObject({
      response_type: 'QUESTION',
      message: '계약서도 사진으로 보내도 되나요?',
    })
  })
})
