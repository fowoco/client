import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LinkUploadPage } from './LinkUploadPage'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
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
  vi.stubGlobal('fetch', vi.fn((input) => {
    const url = String(input)
    if (url.endsWith('/documents')) {
      return Promise.resolve(jsonResponse({ upload_id: 'U-1', file_name: 'passport.jpg', size: 8, expires_at: '2026-08-07T00:00:00Z' }, 201))
    }
    if (url.endsWith('/responses')) {
      return Promise.resolve(jsonResponse({ response_id: 'R-1', received_at: '2026-08-04T00:00:00Z' }, 201))
    }
    return Promise.resolve(jsonResponse({
      guidance: '여권 사본을 제출해 주세요.', due_date: '2026-08-10',
      allowed_responses: ['QUESTION', 'NOT_UNDERSTOOD', 'DIFFICULT', 'DOCUMENT_SUBMITTED'],
    }))
  }))
})

afterEach(() => vi.unstubAllGlobals())

describe('LinkUploadPage', () => {
  it('shows the real selected file without pretending it was uploaded', async () => {
    const user = userEvent.setup()
    renderPage()
    const file = new File(['passport'], 'passport_photo.jpg', { type: 'image/jpeg' })

    await user.upload(await screen.findByLabelText('제출할 파일 선택'), file)

    expect(screen.getByText('passport_photo.jpg')).toBeInTheDocument()
    expect(screen.getByText(/제출 전/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '서류 제출' })).toBeEnabled()
  })

  it('removes the selected file', async () => {
    const user = userEvent.setup()
    renderPage()
    const file = new File(['passport'], 'passport_photo.jpg', { type: 'image/jpeg' })

    await user.upload(await screen.findByLabelText('제출할 파일 선택'), file)
    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(screen.queryByText('passport_photo.jpg')).not.toBeInTheDocument()
  })

  it('rejects unsupported file types', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderPage()
    const file = new File(['script'], 'worker.exe', { type: 'application/octet-stream' })

    await user.upload(await screen.findByLabelText('제출할 파일 선택'), file)

    expect(screen.getByRole('alert')).toHaveTextContent('JPG, PNG, PDF 파일만 선택할 수 있습니다.')
    expect(screen.queryByText('worker.exe')).not.toBeInTheDocument()
  })

  it('uploads the selected file and submits the upload id as a worker response', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: '사진 또는 파일을 추가해 주세요' })
    const file = new File(['passport'], 'passport_photo.jpg', { type: 'image/jpeg' })

    await user.upload(await screen.findByLabelText('제출할 파일 선택'), file)
    await user.click(screen.getByRole('button', { name: '서류 제출' }))

    expect(await screen.findByText('서류를 제출했습니다')).toBeInTheDocument()
    const calls = vi.mocked(fetch).mock.calls
    expect(calls.some(([url]) => String(url).endsWith('/documents'))).toBe(true)
    const responseCall = calls.find(([url]) => String(url).endsWith('/responses'))
    expect(JSON.parse(responseCall?.[1]?.body as string)).toMatchObject({
      response_type: 'DOCUMENT_SUBMITTED', upload_ids: ['U-1'],
    })
  })
})
