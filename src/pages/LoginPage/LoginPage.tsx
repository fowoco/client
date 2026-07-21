import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { DEMO_ACCOUNT, useAuthStore } from '../../store/authStore'
import { AGENT_TRACE_STEPS } from './agentTrace'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [searchParams] = useSearchParams()
  const justSignedUp = searchParams.get('signup') === 'success'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const canSubmit = email.trim() !== '' && password.trim() !== ''

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const success = login(email, password)
    if (success) {
      navigate('/dashboard')
    } else {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
  }

  function handleForgotPassword() {
    // TODO(backend): POST /api/auth/password-reset { email } -> 재설정 메일 발송
  }

  return (
    <div className={styles.page}>
      <aside className={styles.promo}>
        <p className={styles.brand}>FOWOCO</p>
        <p className={styles.kicker}>GUIDED AGENTIC OPERATIONS</p>
        <h1 className={styles.headline}>
          회사의 업무방식을
          <br />
          FOWOCO에 올리세요
        </h1>
        <p className={styles.subtext}>
          Agent가 기한·서류·승인 조건을 먼저 확인
          <br />
          중요한 결정과 실제 실행은 담당자가 통제가능
        </p>

        <div className={styles.trace}>
          <p className={styles.traceTitle}>업무가 진행되는 방식</p>
          {AGENT_TRACE_STEPS.map((step) => (
            <p
              key={step.no}
              className={`${styles.traceStep} ${step.active ? styles.traceStepActive : ''}`}
            >
              {step.no}&nbsp;&nbsp;{step.label}
            </p>
          ))}
        </div>

        <p className={styles.disclaimer}>
          Agent는 자동 제출·법률 판단·급여 지급을 하지 않습니다.
        </p>
      </aside>

      <div className={styles.formSide}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.title}>업무를 시작하세요</h2>
          <p className={styles.description}>
            오늘 처리할 업무와 Agent가 준비한 다음 행동을 확인합니다.
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
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="8자 이상 입력"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className={styles.forgotPassword}
              onClick={handleForgotPassword}
            >
              비밀번호를 잊으셨나요?
            </button>
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <Button type="submit" className={styles.submit} disabled={!canSubmit}>
            로그인
          </Button>

          <p className={styles.signupPrompt}>
            계정이 없으신가요?{' '}
            <Link to="/signup" className={styles.signupLink}>
              회원가입
            </Link>
          </p>

          <div className={styles.notice}>
            <p className={styles.noticeTitle}>데모 계정으로 시작합니다</p>
            <p className={styles.noticeBody}>
              {DEMO_ACCOUNT.email} / {DEMO_ACCOUNT.password}
              <br />
              실제 개인정보나 외부 발송 없이 대표 업무 흐름을 체험할 수 있습니다.
            </p>
          </div>

          <p className={styles.terms}>
            로그인하면 개인정보 처리방침과 서비스 이용약관에 동의합니다.
          </p>
        </form>
      </div>
    </div>
  )
}
