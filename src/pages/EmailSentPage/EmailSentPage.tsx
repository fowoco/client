import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { useToastStore } from '../../store/toastStore'
import styles from './EmailSentPage.module.css'

const RESEND_COOLDOWN_SECONDS = 30

interface EmailSentLocationState {
  email?: string
}

export function EmailSentPage() {
  const location = useLocation()
  const showToast = useToastStore((state) => state.showToast)
  const email = (location.state as EmailSentLocationState | null)?.email ?? 'name@company.com'
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((prev) => Math.max(prev - 1, 0)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  function handleResend() {
    if (cooldown > 0) return
    showToast('재설정 안내를 다시 보냈습니다.')
    setCooldown(RESEND_COOLDOWN_SECONDS)
  }

  function handleOpenEmail() {
    showToast('데모에서는 실제 이메일 앱을 열 수 없습니다.')
  }

  return (
    <div className={styles.page}>
      <aside className={styles.promo}>
        <p className={styles.brand}>FOWOCO</p>
        <p className={styles.kicker}>EMAIL SENT</p>
        <h1 className={styles.headline}>
          안전한 재설정 링크를
          <br />
          이메일로 안내합니다.
        </h1>
        <p className={styles.subtext}>
          메일 발송 여부와 관계없이 동일한 화면을 제공해 계정 정보를 보호합니다.
        </p>
        <p className={styles.disclaimer}>안전한 계정 흐름과 사람의 최종 통제를 유지합니다.</p>
      </aside>

      <div className={styles.formSide}>
        <div className={styles.content}>
          <div className={styles.iconBadge} aria-hidden="true">
            ✉
          </div>
          <h2 className={styles.title}>이메일을 확인해 주세요</h2>
          <p className={styles.description}>{email}으로 비밀번호 재설정 안내를 보냈습니다.</p>

          <div className={styles.note}>
            <p className={styles.noteTitle}>메일이 보이지 않나요?</p>
            <p className={styles.noteBody}>
              스팸함을 확인하거나 30초 후 재설정 안내를 다시 보내 주세요.
            </p>
          </div>

          <Button className={styles.primary} onClick={handleOpenEmail}>
            이메일 열기
          </Button>

          <Button
            variant="secondary"
            className={styles.resend}
            disabled={cooldown > 0}
            onClick={handleResend}
          >
            메일 다시 보내기
          </Button>

          <Link to="/login" className={styles.backLink}>
            로그인으로 돌아가기
          </Link>

          <p className={styles.cooldownText}>
            {cooldown > 0 ? `${cooldown}초 후 다시 보낼 수 있습니다.` : '지금 다시 보낼 수 있습니다.'}
          </p>
        </div>
      </div>
    </div>
  )
}
