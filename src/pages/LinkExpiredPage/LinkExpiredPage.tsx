import { MobileShell } from '../../components/mobile/MobileShell'
import styles from './LinkExpiredPage.module.css'

export function LinkExpiredPage() {
  function handleCopyRequest() {
    // TODO(backend): POST /api/links/:token/reissue-request -> 재발급 요청 문구 생성 후 클립보드 복사
  }

  return (
    <MobileShell expired>
      <div className={styles.iconWrap}>
        <span className={styles.icon}>!</span>
      </div>

      <h1 className={styles.headline}>이 링크는 만료되었습니다.</h1>
      <p className={styles.subtext}>회사 담당자에게 새 링크를 요청해 주세요.</p>

      <div className={styles.reasonCard}>
        <p className={styles.reasonTitle}>링크 상태 · 만료</p>
        <p className={styles.reasonBody}>
          만료시각 2026.07.20 14:30
          <br />
          기존 링크로는 제출할 수 없습니다.
        </p>
      </div>

      <p className={styles.sectionLabel}>담당자에게 요청하는 방법</p>
      <div className={styles.contactCard}>
        <p className={styles.contactName}>한빛정밀 인사팀 · 김민지</p>
        <p className={styles.contactBody}>기존에 안내를 받은 문자 또는 메신저로 요청하세요.</p>
      </div>

      <button type="button" className={styles.copyButton} onClick={handleCopyRequest}>
        재발급 요청 문구 복사
      </button>

      <p className={styles.footnote}>
        새 링크가 발급되면 이전 링크는 즉시 폐기됩니다.
        <br />
        이 버튼은 메시지를 자동 발송하지 않습니다.
      </p>
    </MobileShell>
  )
}
