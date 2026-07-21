import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useAsyncDemoData } from './useAsyncDemoData'

function wrapper(initialPath: string) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
  )
}

describe('useAsyncDemoData', () => {
  it('starts loading and resolves to success when data is not empty', async () => {
    const { result } = renderHook(() => useAsyncDemoData(false, 10), {
      wrapper: wrapper('/dashboard'),
    })

    expect(result.current).toBe('loading')
    await waitFor(() => expect(result.current).toBe('success'))
  })

  it('resolves to empty when isEmpty is true', async () => {
    const { result } = renderHook(() => useAsyncDemoData(true, 10), {
      wrapper: wrapper('/dashboard'),
    })

    await waitFor(() => expect(result.current).toBe('empty'))
  })

  it('respects a forced demoState query param', () => {
    const { result } = renderHook(() => useAsyncDemoData(false, 10), {
      wrapper: wrapper('/dashboard?demoState=error'),
    })

    expect(result.current).toBe('error')
  })
})
