import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import styles from './SignupPage.module.css'
import { SIGNUP_BENEFITS } from './signupData'

interface FieldErrors {
  workplace?: string
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export function SignupPage() {
  const navigate = useNavigate()

  const [workplace, setWorkplace] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function validate(): FieldErrors {
    const errors: FieldErrors = {}
    if (!workplace.trim()) errors.workplace = '사업장명을 입력해 주세요.'
    if (!name.trim()) errors.name = '이름을 입력해 주세요.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = '올바른 이메일 형식이 아닙니다.'
    if (password.length < 8) errors.password = '비밀번호는 8자 이상이어야 합니다.'
    if (confirmPassword !== password) errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    return errors
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    // TODO(backend): POST /api/auth/signup { workplace, name, email, password } -> 계정 생성
    navigate('/?signup=success')
  }

  return (
    <div className={styles.page}>
      <aside className={styles.promo}>
        <p className={styles.brand}>FOWOCO</p>
        <p className={styles.kicker}>GUIDED AGENTIC OPERATIONS</p>
        <h1 className={styles.headline}>
          우리 회사의 업무 방식을
          <br />
          FOWOCO에 등록하세요
        </h1>
        <p className={styles.subtext}>
          사업장 정보를 등록하면 담당자 초대와 승인 정책을
          <br />
          바로 설정할 수 있습니다.
        </p>

        <div className={styles.benefits}>
          {SIGNUP_BENEFITS.map((benefit) => (
            <div key={benefit} className={styles.benefitRow}>
              <span className={styles.benefitDot} aria-hidden="true" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <p className={styles.disclaimer}>
          Agent는 자동 제출·법률 판단·급여 지급을 하지 않습니다.
        </p>
      </aside>

      <div className={styles.formSide}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <h2 className={styles.title}>회원가입</h2>
          <p className={styles.description}>사업장 정보와 담당자 계정을 등록합니다.</p>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="workplace">
              사업장명
            </label>
            <input
              id="workplace"
              className={`${styles.input} ${fieldErrors.workplace ? styles.inputError : ''}`}
              placeholder="한빛정밀"
              value={workplace}
              onChange={(event) => setWorkplace(event.target.value)}
            />
            {fieldErrors.workplace && <p className={styles.fieldError}>{fieldErrors.workplace}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              이름
            </label>
            <input
              id="name"
              className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`}
              placeholder="김경민"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {fieldErrors.name && <p className={styles.fieldError}>{fieldErrors.name}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              type="email"
              className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {fieldErrors.email && <p className={styles.fieldError}>{fieldErrors.email}</p>}
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
                placeholder="8자 이상 입력"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {fieldErrors.password && <p className={styles.fieldError}>{fieldErrors.password}</p>}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirmPassword">
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`${styles.input} ${
                  fieldErrors.confirmPassword ? styles.inputError : ''
                }`}
                placeholder="다시 입력"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              {fieldErrors.confirmPassword && (
                <p className={styles.fieldError}>{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <Button type="submit" className={styles.submit}>
            회원가입
          </Button>

          <p className={styles.loginPrompt}>
            이미 계정이 있으신가요? <Link to="/" className={styles.loginLink}>로그인</Link>
          </p>

          <p className={styles.terms}>
            가입하면 개인정보 처리방침과 서비스 이용약관에 동의합니다.
          </p>
        </form>
      </div>
    </div>
  )
}
