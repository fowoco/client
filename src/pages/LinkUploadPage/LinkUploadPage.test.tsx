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
  it('disables submit until a file is selected', async () => {
    const user = userEvent.setup()
    renderPage()

    const submit = screen.getByRole('button', { name: '제출하기' })
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '파일 또는 사진 선택' }))

    expect(submit).toBeEnabled()
    expect(screen.getByText('passport_photo.jpg')).toBeInTheDocument()
  })

  it('removes the selected file', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '파일 또는 사진 선택' }))
    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(screen.queryByText('passport_photo.jpg')).not.toBeInTheDocument()
  })
})
