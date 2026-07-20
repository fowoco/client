import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CreateWorkPage } from './CreateWorkPage'

function renderPage() {
  render(
    <MemoryRouter>
      <CreateWorkPage />
    </MemoryRouter>,
  )
}

describe('CreateWorkPage', () => {
  it('disables the analyze button until a request is entered', async () => {
    const user = userEvent.setup()
    renderPage()

    const analyze = screen.getByRole('button', { name: '요청 분석하기 →' })
    expect(analyze).toBeDisabled()

    await user.type(screen.getByLabelText('업무 요청 내용'), '체류연장 서류 준비')
    expect(analyze).toBeEnabled()
  })

  it('fills the textarea when an example chip is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '체류연장 준비' }))

    expect(screen.getByLabelText('업무 요청 내용')).toHaveValue('체류연장 준비')
  })

  it('switches the active input mode', async () => {
    const user = userEvent.setup()
    renderPage()

    const fileMode = screen.getByRole('button', { name: /파일 가져오기/ })
    await user.click(fileMode)

    expect(fileMode.className).toMatch(/modeCardActive/)
  })
})
