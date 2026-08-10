import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import styles from './RouteTransition.module.css'

export function RouteTransition() {
  const location = useLocation()

  return (
    <div key={location.pathname} className={styles.fade}>
      <Suspense
        fallback={
          <div className={styles.loading} role="status" aria-live="polite">
            <span className={styles.loadingDot} aria-hidden="true" />
            화면을 불러오는 중입니다
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </div>
  )
}
