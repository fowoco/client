import { useNavigate } from 'react-router-dom'
import { MobileShell } from '../../components/mobile/MobileShell'
import styles from './LinkRequestPage.module.css'
import { LINK_REQUEST } from './linkRequestData'

export function LinkRequestPage() {
  const navigate = useNavigate()

  return (
    <MobileShell right={<span>보안 링크</span>}>
      <div className={styles.expiryNotice}>
        <p className={styles.expiryTitle}>{LINK_REQUEST.expiryNotice.title}</p>
        <p className={styles.expiryBody}>{LINK_REQUEST.expiryNotice.body}</p>
      </div>

      <p className={styles.requester}>{LINK_REQUEST.requester}</p>
      <h1 className={styles.headline}>
        {LINK_REQUEST.headline[0]}
        <br />
        {LINK_REQUEST.headline[1]}
      </h1>
      <p className={styles.deadline}>{LINK_REQUEST.deadline}</p>

      <hr className={styles.divider} />

      <p className={styles.body}>{LINK_REQUEST.body}</p>

      <div className={styles.privacy}>
        <p className={styles.privacyTitle}>{LINK_REQUEST.privacy.title}</p>
        <p className={styles.privacyBody}>{LINK_REQUEST.privacy.body}</p>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.secondary}>
          질문이 있습니다
        </button>
        <button
          type="button"
          className={styles.primary}
          onClick={() => navigate('/worker-portal/upload')}
        >
          안내를 확인했습니다
        </button>
      </div>

      <p className={styles.footnote}>{LINK_REQUEST.footnote}</p>
    </MobileShell>
  )
}
