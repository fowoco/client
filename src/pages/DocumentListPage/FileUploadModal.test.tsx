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
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('FileUploadModal', () => {
  it('uploads a valid HWPX file via the file picker and shows a file_id when done', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<FileUploadModal open onClose={() => {}} />)

    const input = screen.getByLabelText('HWP/HWPX 파일 선택')
    const file = makeFile('계약서.hwpx', 2048)
    await user.upload(input, file)

    expect(screen.getByText('계약서.hwpx')).toBeInTheDocument()
    expect(screen.getByText(/업로드 중/)).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(1000)

    expect(await screen.findByText(/업로드 완료 · file-/)).toBeInTheDocument()
  })

  it('rejects a file with an unsupported extension (bypassing the input accept filter via drag and drop)', () => {
    render(<FileUploadModal open onClose={() => {}} />)

    const dropzone = screen.getByText('여기로 파일을 끌어다 놓거나').closest('div')!
    fireEvent.drop(dropzone, { dataTransfer: { files: [makeFile('사진.jpg', 1024)] } })

    expect(screen.getByText(/지원하지 않는 파일 형식입니다/)).toBeInTheDocument()
  })

  it('rejects a file larger than 10MB', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<FileUploadModal open onClose={() => {}} />)

    const input = screen.getByLabelText('HWP/HWPX 파일 선택')
    await user.upload(input, makeFile('큰파일.hwp', 11 * 1024 * 1024))

    expect(screen.getByText(/파일이 너무 큽니다/)).toBeInTheDocument()
  })

  it('accepts a dropped file via drag and drop', () => {
    render(<FileUploadModal open onClose={() => {}} />)

    const dropzone = screen.getByText('여기로 파일을 끌어다 놓거나').closest('div')!
    const file = makeFile('안내문.hwp', 4096)
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } })

    expect(screen.getByText('안내문.hwp')).toBeInTheDocument()
  })

  it('removes a file from the list', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<FileUploadModal open onClose={() => {}} />)

    const input = screen.getByLabelText('HWP/HWPX 파일 선택')
    await user.upload(input, makeFile('삭제할파일.hwp', 1024))
    expect(screen.getByText('삭제할파일.hwp')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(screen.queryByText('삭제할파일.hwp')).not.toBeInTheDocument()
  })

  it('closes via the 닫기 button', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
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

  it('waits for pending upload timers before letting Vitest tear down the test', async () => {
    // useEffect cleanup in the component clears pending timers on unmount; this test just
    // asserts nothing throws when a component with an in-flight upload unmounts.
    const { unmount } = render(<FileUploadModal open onClose={() => {}} />)
    const input = screen.getByLabelText('HWP/HWPX 파일 선택')
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.upload(input, makeFile('언마운트.hwp', 1024))

    unmount()

    await waitFor(() => {})
  })
})
