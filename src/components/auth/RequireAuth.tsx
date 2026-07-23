import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function RequireAuth() {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const restoreSession = useAuthStore((state) => state.restoreSession)

  useEffect(() => {
    // 앱을 처음 열었을 때(status === 'idle')만 시도한다. 로그인 직후에는 login()이 이미
    // status를 'ready'로 만들어두므로 여기서 다시 refresh를 호출하지 않는다.
    if (status === 'idle') {
      restoreSession()
    }
  }, [status, restoreSession])

  if (status !== 'ready') {
    // 세션 복원 중에는 잠깐 아무것도 그리지 않는다 (로그인 화면 깜빡임 방지).
    return null
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
