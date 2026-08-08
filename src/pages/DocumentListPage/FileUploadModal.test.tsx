import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FileUploadModal } from './FileUploadModal'

function makeFile(name: string, sizeBytes: number, type = 'application/octet-stream'): File {
  const file = new File([new Uint8Array(Math.min(sizeBytes, 1024))], name, { type })
  Object.defineProperty(file, 'size', { value: sizeBytes })
  return file
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
    file_id: 'file-server-1',
    name: '계약서.hwpx',
    mime_type: 'application/octet-stream',
    size: 2048,
    scan_status: 'NOT_SCANNED',
  }), { status: 201, headers: { 'Content-Type': 'application/json' } })))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('FileUploadModal', () => {
  it('uploads a valid HWPX file via the file picker and shows a file_id when done', async () => {
    const user = userEvent.setup()
    render(<FileUploadModal open onClose={() => {}} />)

    const input = screen.getByLabelText('HWP/HWPX 파일 선택')
    const file = makeFile('계약서.hwpx', 2048)
    await user.upload(input, file)

    expect(screen.getByText('계약서.hwpx')).toBeInTheDocument()
    expect(await screen.findByText(/업로드 완료 · file-server-1/)).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)
    const [, init] = vi.mocked(fetch).mock.calls[0]
    const formData = init?.body as FormData
    expect(formData.get('file')).toBe(file)
    expect(formData.get('purpose')).toBe('document_automation')
  })

  it('rejects a file with an unsupported extension (bypassing the input accept filter via drag and drop)', () => {
    render(<FileUploadModal open onClose={() => {}} />)

    const dropzone = screen.getByText('여기로 파일을 끌어다 놓거나').closest('div')!
    fireEvent.drop(dropzone, { dataTransfer: { files: [makeFile('사진.jpg', 1024)] } })

    expect(screen.getByText(/지원하지 않는 파일 형식입니다/)).toBeInTheDocument()
  })

  it('rejects a file larger than 20MB', async () => {
    const user = userEvent.setup()
    render(<FileUploadModal open onClose={() => {}} />)

    const input = screen.getByLabelText('HWP/HWPX 파일 선택')
    await user.upload(input, makeFile('큰파일.hwp', 21 * 1024 * 1024))

    expect(screen.getByText(/파일이 너무 큽니다/)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('accepts a dropped file via drag and drop', async () => {
    render(<FileUploadModal open onClose={() => {}} />)

    const dropzone = screen.getByText('여기로 파일을 끌어다 놓거나').closest('div')!
    const file = makeFile('안내문.hwp', 4096)
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } })

    expect(screen.getByText('안내문.hwp')).toBeInTheDocument()
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
  })

  it('removes a file from the list', async () => {
    const user = userEvent.setup()
    render(<FileUploadModal open onClose={() => {}} />)

    const input = screen.getByLabelText('HWP/HWPX 파일 선택')
    await user.upload(input, makeFile('삭제할파일.hwp', 1024))
    expect(screen.getByText('삭제할파일.hwp')).toBeInTheDocument()

    await screen.findByText(/업로드 완료/)
    await user.click(screen.getByRole('button', { name: '목록에서 제거' }))

    expect(screen.queryByText('삭제할파일.hwp')).not.toBeInTheDocument()
  })

  it('closes via the 닫기 button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<FileUploadModal open onClose={onClose} />)

    const closeButtons = screen.getAllByRole('button', { name: '닫기' })
    await user.click(closeButtons[closeButtons.length - 1])

    expect(onClose).toHaveBeenCalled()
  })

  it('renders nothing when closed', () => {
    render(<FileUploadModal open={false} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the server error and allows removing a failed upload', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      timestamp: '2026-08-08T00:00:00Z',
      status: 415,
      code: 'UNSUPPORTED_FILE_TYPE',
      message: '지원하지 않는 파일입니다.',
      path: '/api/v1/files',
      request_id: 'request-1',
      field_errors: [],
    }), { status: 415, headers: { 'Content-Type': 'application/json' } }))
    const user = userEvent.setup()
    render(<FileUploadModal open onClose={() => {}} />)
    const input = screen.getByLabelText('HWP/HWPX 파일 선택')
    await user.upload(input, makeFile('손상파일.hwp', 1024))

    expect(await screen.findByText(/지원하지 않는 파일입니다/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '목록에서 제거' }))
    expect(screen.queryByText('손상파일.hwp')).not.toBeInTheDocument()
  })
})
