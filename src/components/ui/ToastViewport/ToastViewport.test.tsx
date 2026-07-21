import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useToastStore } from '../../../store/toastStore'
import { ToastViewport } from './ToastViewport'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('ToastViewport', () => {
  it('renders nothing when there are no toasts', () => {
    render(<ToastViewport />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders a toast pushed via showToast', () => {
    render(<ToastViewport />)

    act(() => {
      useToastStore.getState().showToast('저장했습니다.')
    })

    expect(screen.getByText('저장했습니다.')).toBeInTheDocument()
  })

  it('dismisses a toast when its close button is clicked', async () => {
    const user = userEvent.setup()
    render(<ToastViewport />)

    act(() => {
      useToastStore.getState().showToast('저장했습니다.')
    })

    await user.click(screen.getByRole('button', { name: '알림 닫기' }))

    expect(screen.queryByText('저장했습니다.')).not.toBeInTheDocument()
  })
})
