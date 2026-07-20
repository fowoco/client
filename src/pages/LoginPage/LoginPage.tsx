import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button/Button'
import { AGENT_TRACE_STEPS } from './agentTrace'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const canSubmit = email.trim() !== '' && password.trim() !== ''

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // TODO(backend): POST /api/auth/login { email, password } -> 세션/토큰 저장 후 /dashboard 이동
  }

  return (
    <div className={styles.page}>
      <aside className={styles.promo}>
        <p className={styles.brand}>FOWOCO</p>
        <p className={styles.kicker}>GUIDED AGENTIC OPERATIONS</p>
        <h1 className={styles.headline}>
          복잡한 행정업무를
          <br />
          확인 가능한 다음 행동으로
        </h1>
        <p className={styles.subtext}>
          Agent가 기한·서류·승인 조건을 먼저 확인합니다.
          <br />
          중요한 결정과 실제 실행은 담당자가 통제합니다.
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
            <button type="button" className={styles.forgotPassword}>
              비밀번호를 잊으셨나요?
            </button>
          </div>

          <Button type="submit" className={styles.submit} disabled={!canSubmit}>
            로그인
          </Button>

          <div className={styles.notice}>
            <p className={styles.noticeTitle}>데모 계정으로 시작합니다</p>
            <p className={styles.noticeBody}>
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
