import { useEffect, useState } from 'react'

// TODO(backend): 실 API 연동 시 이 값으로 검색 요청을 트리거해 매 키 입력마다
// 요청이 나가지 않도록 한다. 지금은 클라이언트 필터링에 적용해 재사용성을 확인한다.

export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
