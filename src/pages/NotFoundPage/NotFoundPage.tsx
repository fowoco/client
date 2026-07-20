import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  const error = useRouteError()
  const isServerError = isRouteErrorResponse(error) && error.status >= 500

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        {isServerError ? '문제가 발생했습니다' : '페이지를 찾을 수 없습니다'}
      </h1>
      <p className={styles.body}>
        {isServerError
          ? '잠시 후 다시 시도하거나 대시보드로 돌아가 주세요.'
          : '주소가 정확한지 확인해 주세요.'}
      </p>
      <Link to="/dashboard" className={styles.link}>
        대시보드로 이동
      </Link>
    </div>
  )
}
