import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// TODO(backend): 실제 API 연동 시 이 훅을 React Query의 useQuery로 교체.
// 지금은 백엔드가 없어 loading -> success/empty 전이를 흉내내며, 개발/데모 중에는
// URL에 ?demoState=loading|empty|error 를 붙여 각 상태를 강제로 미리볼 수 있다.
// 예) /dashboard?demoState=error

export type AsyncStatus = 'loading' | 'success' | 'empty' | 'error'

export function useAsyncDemoData(isEmpty: boolean, delayMs = 400) {
  const [searchParams] = useSearchParams()
  const forced = searchParams.get('demoState') as AsyncStatus | null

  const [status, setStatus] = useState<AsyncStatus>(forced ?? 'loading')

  useEffect(() => {
    if (forced) {
      setStatus(forced)
      return
    }

    setStatus('loading')
    const timer = setTimeout(() => {
      setStatus(isEmpty ? 'empty' : 'success')
    }, delayMs)

    return () => clearTimeout(timer)
  }, [forced, isEmpty, delayMs])

  return status
}
