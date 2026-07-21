import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToastStore } from './toastStore'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToastStore', () => {
  it('adds a toast when showToast is called', () => {
    useToastStore.getState().showToast('저장했습니다.')

    expect(useToastStore.getState().toasts).toHaveLength(1)
    expect(useToastStore.getState().toasts[0].message).toBe('저장했습니다.')
  })

  it('auto-dismisses a toast after the display duration', () => {
    useToastStore.getState().showToast('저장했습니다.')
    expect(useToastStore.getState().toasts).toHaveLength(1)

    vi.advanceTimersByTime(3000)

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('dismissToast removes a specific toast by id', () => {
    useToastStore.getState().showToast('첫 번째')
    useToastStore.getState().showToast('두 번째')
    const [first] = useToastStore.getState().toasts

    useToastStore.getState().dismissToast(first.id)

    expect(useToastStore.getState().toasts).toHaveLength(1)
    expect(useToastStore.getState().toasts[0].message).toBe('두 번째')
  })
})
