import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { Checkbox } from '../../components/ui/Checkbox/Checkbox'
import { EyeIcon, EyeOffIcon } from '../../components/ui/icons/EyeIcons'
import { LockIcon, MailIcon } from '../../components/ui/icons/FieldIcons'
import { DEMO_ACCOUNT, useAuthStore } from '../../store/authStore'
import { LOGIN_PROMISES } from './loginData'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [searchParams] = useSearchParams()
  const justSignedUp = searchParams.get('signup') === 'success'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [demoSubmitting, setDemoSubmitting] = useState(false)

  const canSubmit = email.trim() !== '' && password.trim() !== '' && !submitting

  async function attemptLogin(loginEmail: string, loginPassword: string) {
    setError('')
    const result = await login(loginEmail, loginPassword)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.message ?? '이메일 또는 비밀번호가 올바르지 않습니다.')
    }
    return result.success
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    await attemptLogin(email, password)
    setSubmitting(false)
  }

  async function handleDemoLogin() {
    setDemoSubmitting(true)
    await attemptLogin(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password)
    setDemoSubmitting(false)
  }

  return (
    <div className={styles.page}>
      <aside className={styles.promo}>
        <p className={styles.brand}>FOWOCO</p>
        <p className={styles.kicker}>GUIDED AGENTIC OPERATIONS</p>
        <h1 className={styles.headline}>
          Agent가 먼저 준비하고,
          <br />
          사람이 검토하고 결정합니다.
        </h1>
        <p className={styles.subtext}>체류·계약·문서 업무의 현재 상황과 다음 행동을 확인하세요.</p>

        <ul className={styles.promiseList}>
          {LOGIN_PROMISES.map((promise) => (
            <li key={promise} className={styles.promiseRow}>
              ✓ {promise}
            </li>
          ))}
        </ul>

        <p className={styles.disclaimer}>
          Agent는 자동 승인·법률 판단·급여 지급을 하지 않습니다.
        </p>
      </aside>

      <div className={styles.formSide}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <h2 className={styles.title}>업무를 이어서 시작하세요</h2>
          <p className={styles.description}>
            Agent가 준비한 업무를 검토하고, 중요한 결정은 직접 승인하세요.
          </p>

          {justSignedUp && (
            <p className={styles.successBanner}>
              회원가입이 완료되었습니다. 로그인해 주세요.
            </p>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              이메일
            </label>
            <div className={styles.inputShell}>
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
            <p className={styles.helperText}>업무용 이메일을 입력해 주세요.</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              비밀번호
            </label>
            <div className={styles.inputShell}>
              <LockIcon className={styles.inputIcon} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="8자 이상 입력"
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
            <p className={styles.helperText}>영문과 숫자를 포함해 8자 이상 입력해 주세요.</p>
          </div>

          <div className={styles.rememberRow}>
            <Checkbox
              id="remember-me"
              label="로그인 상태 유지"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <Link to="/forgot-password" className={styles.forgotPassword}>
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <Button type="submit" className={styles.submit} disabled={!canSubmit} isLoading={submitting}>
            로그인
          </Button>

          <p className={styles.signupPrompt}>
            아직 계정이 없으신가요?{' '}
            <Link to="/signup" className={styles.signupLink}>
              회원가입
            </Link>
          </p>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerLabel}>또는</span>
            <span className={styles.dividerLine} />
          </div>

          <div className={styles.demoCard}>
            <p className={styles.demoEyebrow}>DEMO</p>
            <p className={styles.demoTitle}>샘플 데이터로 바로 둘러보기</p>
            <p className={styles.demoBody}>
              실제 개인정보 없이 대표 업무 흐름을 빠르게 체험할 수 있습니다.
            </p>
            <Button
              type="button"
              variant="secondary"
              className={styles.demoButton}
              isLoading={demoSubmitting}
              onClick={handleDemoLogin}
            >
              데모로 시작 →
            </Button>
          </div>

          <div className={styles.legalRow}>
            <button type="button" className={styles.legalLink}>
              개인정보처리방침
            </button>
            <button type="button" className={styles.legalLink}>
              서비스 이용약관
            </button>
          </div>

          <p className={styles.terms}>
            개인정보는 로그인과 회사 업무 공간 제공을 위해서만 사용합니다.
          </p>
        </form>
      </div>
    </div>
  )
}
