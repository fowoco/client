import { Outlet, useLocation } from 'react-router-dom'
import styles from './RouteTransition.module.css'

export function RouteTransition() {
  const location = useLocation()

  return (
    <div key={location.pathname} className={styles.fade}>
      <Outlet />
    </div>
  )
}
