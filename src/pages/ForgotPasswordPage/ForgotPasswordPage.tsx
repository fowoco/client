import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { MailIcon } from '../../components/ui/icons/FieldIcons'
import styles from './ForgotPasswordPage.module.css'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('이메일 형식을 확인해 주세요.')
      return
    }
    setError('')
    setSubmitting(true)
    navigate('/email-sent', { state: { email } })
  }

  return (
    <div className={styles.page}>
      <aside className={styles.promo}>
        <p className={styles.brand}>FOWOCO</p>
        <p className={styles.kicker}>ACCOUNT RECOVERY</p>
        <h1 className={styles.headline}>
          계정 보안을 지키며
          <br />
          비밀번호를 재설정합니다.
        </h1>
        <p className={styles.subtext}>
          가입 이메일이 노출되지 않도록 동일한 안내를 제공하고, 재설정 작업만 수행합니다.
        </p>
        <p className={styles.disclaimer}>Agent는 준비하고, 중요한 결정은 사람이 수행합니다.</p>
      </aside>

      <div className={styles.formSide}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <h2 className={styles.title}>비밀번호를 잊으셨나요?</h2>
          <p className={styles.description}>
            가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
          </p>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              이메일
            </label>
            <div className={`${styles.inputShell} ${error ? styles.inputShellError : ''}`}>
              <MailIcon className={styles.inputIcon} />
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="name@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <p className={error ? styles.fieldError : styles.helperText}>
              {error || '입력한 이메일은 계정 확인과 재설정에만 사용합니다.'}
            </p>
          </div>

          <Button type="submit" className={styles.submit} isLoading={submitting}>
            재설정 메일 보내기
          </Button>

          <Link to="/login" className={styles.backLink}>
            로그인으로 돌아가기
          </Link>

          <div className={styles.note}>
            <p className={styles.noteTitle}>계정 정보 보호</p>
            <p className={styles.noteBody}>
              입력한 이메일로 가입된 계정이 있으면 재설정 안내를 보내드립니다.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
