import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { EyeIcon, EyeOffIcon } from '../../components/ui/icons/EyeIcons'
import { LockIcon } from '../../components/ui/icons/FieldIcons'
import { getPasswordStrength } from '../../utils/passwordStrength'
import styles from './ResetPasswordPage.module.css'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const passwordStrength = getPasswordStrength(password)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 8) {
      setError('영문과 숫자를 포함해 8자 이상 입력해 주세요.')
      return
    }
    if (confirmPassword !== password) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setError('')
    setSubmitting(true)
    navigate('/reset-complete')
  }

  return (
    <div className={styles.page}>
      <aside className={styles.promo}>
        <p className={styles.brand}>FOWOCO</p>
        <p className={styles.kicker}>NEW PASSWORD</p>
        <h1 className={styles.headline}>
          새 비밀번호로
          <br />
          계정 접근을 보호합니다.
        </h1>
        <p className={styles.subtext}>
          다른 서비스에서 사용하지 않는 비밀번호를 설정하고, 일치 여부를 확인합니다.
        </p>
        <p className={styles.disclaimer}>안전한 계정 흐름과 사람의 최종 통제를 유지합니다.</p>
      </aside>

      <div className={styles.formSide}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <h2 className={styles.title}>새 비밀번호 설정</h2>
          <p className={styles.description}>영문과 숫자를 포함해 8자 이상 입력해 주세요.</p>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              새 비밀번호
            </label>
            <div className={`${styles.inputShell} ${error ? styles.inputShellError : ''}`}>
              <LockIcon className={styles.inputIcon} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                {showPassword ? (
                  <EyeOffIcon className={styles.toggleIcon} />
                ) : (
                  <EyeIcon className={styles.toggleIcon} />
                )}
              </button>
            </div>
            <p className={styles.helperText}>다른 서비스에서 사용하지 않는 비밀번호를 설정해 주세요.</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">
              비밀번호 확인
            </label>
            <div className={`${styles.inputShell} ${error ? styles.inputShellError : ''}`}>
              <LockIcon className={styles.inputIcon} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className={styles.input}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className={styles.toggleIcon} />
                ) : (
                  <EyeIcon className={styles.toggleIcon} />
                )}
              </button>
            </div>
            <p className={styles.helperText}>비밀번호를 다시 입력해 주세요.</p>
          </div>

          {passwordStrength && (
            <div className={styles.strength}>
              <p className={styles.strengthLabel}>비밀번호 강도 · {passwordStrength.label}</p>
              <div className={styles.strengthBars}>
                {[1, 2, 3].map((bar) => (
                  <span
                    key={bar}
                    className={`${styles.strengthBar} ${
                      bar <= passwordStrength.score
                        ? styles[`strengthBar-${passwordStrength.tone}`]
                        : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {error && <p className={styles.fieldError}>{error}</p>}

          <Button type="submit" className={styles.submit} isLoading={submitting}>
            비밀번호 변경
          </Button>

          <div className={styles.expiredNote}>
            <p className={styles.expiredTitle}>링크가 만료되었나요?</p>
            <p className={styles.expiredBody}>
              새 재설정 링크를 요청해 안전하게 다시 시작할 수 있습니다.
            </p>
            <Link to="/forgot-password" className={styles.expiredLink}>
              재설정 링크 다시 받기
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
