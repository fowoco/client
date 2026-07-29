import { Component, type ErrorInfo, type ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

export interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

// 화면 렌더링 중 예상 못한 예외(널 참조, API 응답 형태 불일치 등)가 던져지면 앱 전체가
// 빈 화면으로 죽는 대신 이 화면을 보여준다. React 에러 바운더리는 클래스 컴포넌트로만
// 만들 수 있다.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled render error', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>문제가 발생했습니다</h1>
          <p className={styles.body}>
            예상하지 못한 오류로 화면을 표시할 수 없습니다. 새로고침한 뒤에도 계속되면
            담당자에게 알려주세요.
          </p>
          <button type="button" className={styles.action} onClick={this.handleReload}>
            새로고침
          </button>
        </div>
      </div>
    )
  }
}
