import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors'
import { useApiQuery } from './useApiQuery'

describe('useApiQuery', () => {
  it('starts in loading state', () => {
    const fetcher = vi.fn().mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useApiQuery(fetcher))

    expect(result.current.status).toBe('loading')
    expect(result.current.data).toBeNull()
  })

  it('transitions to success with the fetched data', async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: '1' })
    const { result } = renderHook(() => useApiQuery(fetcher))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.data).toEqual({ id: '1' })
    expect(result.current.error).toBeNull()
  })

  it('transitions to empty when isEmpty(data) is true', async () => {
    const fetcher = vi.fn().mockResolvedValue([])
    const isEmpty = (data: unknown[]) => data.length === 0
    const { result } = renderHook(() => useApiQuery(fetcher, isEmpty))

    await waitFor(() => expect(result.current.status).toBe('empty'))
    expect(result.current.data).toEqual([])
  })

  it('transitions to error with the ApiError when the fetcher rejects', async () => {
    const error = new ApiError({
      timestamp: '2026-07-22T01:23:45Z',
      status: 404,
      code: 'RESOURCE_NOT_FOUND',
      message: '요청한 정보를 찾을 수 없습니다.',
      path: '/api/v1/workers',
      request_id: 'req-1',
      field_errors: [],
    })
    const fetcher = vi.fn().mockRejectedValue(error)
    const { result } = renderHook(() => useApiQuery(fetcher))

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe(error)
    expect(result.current.data).toBeNull()
  })

  it('refetch() triggers the fetcher again', async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: '1' })
    const { result } = renderHook(() => useApiQuery(fetcher))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(fetcher).toHaveBeenCalledTimes(1)

    result.current.refetch()

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  })
})
