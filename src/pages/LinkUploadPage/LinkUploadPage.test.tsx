import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LinkUploadPage } from './LinkUploadPage'

function renderPage() {
  render(
    <MemoryRouter>
      <LinkUploadPage />
    </MemoryRouter>,
  )
}

describe('LinkUploadPage', () => {
  it('shows the real selected file without pretending it was uploaded', async () => {
    const user = userEvent.setup()
    renderPage()
    const file = new File(['passport'], 'passport_photo.jpg', { type: 'image/jpeg' })

    await user.upload(screen.getByLabelText('제출할 파일 선택'), file)

    expect(screen.getByText('passport_photo.jpg')).toBeInTheDocument()
    expect(screen.getByText(/제출 전/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '제출 API 연결 필요' })).toBeDisabled()
  })

  it('removes the selected file', async () => {
    const user = userEvent.setup()
    renderPage()
    const file = new File(['passport'], 'passport_photo.jpg', { type: 'image/jpeg' })

    await user.upload(screen.getByLabelText('제출할 파일 선택'), file)
    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(screen.queryByText('passport_photo.jpg')).not.toBeInTheDocument()
  })

  it('rejects unsupported file types', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderPage()
    const file = new File(['script'], 'worker.exe', { type: 'application/octet-stream' })

    await user.upload(screen.getByLabelText('제출할 파일 선택'), file)

    expect(screen.getByRole('alert')).toHaveTextContent('JPG, PNG, PDF 파일만 선택할 수 있습니다.')
    expect(screen.queryByText('worker.exe')).not.toBeInTheDocument()
  })
})
