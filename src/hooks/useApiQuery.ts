import { useEffect, useState } from 'react'
import { ApiError, networkApiError } from '../api/errors'

// useAsyncDemoData와 동일한 'loading'|'success'|'empty'|'error' 상태 모양을 실제 API 응답
// 기준으로 만든 버전이다. 데모 페이지를 실 API로 바꿀 때 컴포넌트(EmptyState 분기)는
// 그대로 두고, 데이터를 공급하는 훅만 useAsyncDemoData -> useApiQuery로 교체하면 된다.
export type ApiQueryStatus = 'loading' | 'success' | 'empty' | 'error'

export interface UseApiQueryResult<T> {
  status: ApiQueryStatus
  data: T | null
  error: ApiError | null
  refetch: () => void
}

/**
 * `fetcher`와 `isEmpty`는 매 렌더마다 새 함수를 넘기면 무한 재요청이 발생하므로,
 * 호출부에서 `useCallback`으로 안정화하거나(컴포넌트 밖에 정의해서) 넘겨야 한다.
 */
export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  isEmpty?: (data: T) => boolean,
): UseApiQueryResult<T> {
  const [status, setStatus] = useState<ApiQueryStatus>('loading')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError(null)

    fetcher()
      .then((result) => {
        if (cancelled) return
        setData(result)
        setStatus(isEmpty?.(result) ? 'empty' : 'success')
      })
      .catch((caught: unknown) => {
        if (cancelled) return
        setError(caught instanceof ApiError ? caught : networkApiError(''))
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [fetcher, isEmpty, reloadToken])

  return { status, data, error, refetch: () => setReloadToken((n) => n + 1) }
}
