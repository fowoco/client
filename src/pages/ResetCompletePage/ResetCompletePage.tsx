import { Link } from 'react-router-dom'
import styles from './ResetCompletePage.module.css'

export function ResetCompletePage() {
  return (
    <div className={styles.page}>
      <aside className={styles.promo}>
        <p className={styles.brand}>FOWOCO</p>
        <p className={styles.kicker}>PASSWORD UPDATED</p>
        <h1 className={styles.headline}>
          변경 결과를 명확하게
          <br />
          확인하고 로그인합니다.
        </h1>
        <p className={styles.subtext}>
          완료 상태는 장식보다 결과와 다음 행동을 우선해 전달합니다.
        </p>
        <p className={styles.disclaimer}>안전한 계정 흐름과 사람의 최종 통제를 유지합니다.</p>
      </aside>

      <div className={styles.formSide}>
        <div className={styles.content}>
          <div className={styles.iconBadge} aria-hidden="true">
            ✓
          </div>
          <h2 className={styles.title}>비밀번호가 변경되었습니다</h2>
          <p className={styles.description}>새 비밀번호로 안전하게 로그인할 수 있습니다.</p>

          <Link to="/login" className={styles.primary}>
            로그인하기
          </Link>

          <div className={styles.note}>
            <p className={styles.noteTitle}>보안 안내</p>
            <p className={styles.noteBody}>
              다른 기기에서 로그인 중이라면 필요에 따라 다시 인증해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
