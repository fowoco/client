import { useState, type FormEvent } from 'react'
import styles from './LoginPage.module.css'
import { LOGIN_ROLES, type LoginRole } from './roles'

export function LoginPage() {
  const [role, setRole] = useState<LoginRole>('현장관리자')
  const [companyCode, setCompanyCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const canSubmit = companyCode.trim() !== '' && email.trim() !== '' && password.trim() !== ''

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.logo}>FOWOCO</h1>

        <div className={styles.roleTabs} role="tablist" aria-label="로그인 권한 선택">
          {LOGIN_ROLES.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={role === option}
              className={`${styles.roleTab} ${role === option ? styles.roleTabActive : ''}`}
              onClick={() => setRole(option)}
            >
              {option}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="companyCode">
              사업장 코드
            </label>
            <input
              id="companyCode"
              className={styles.input}
              placeholder="사업장 코드"
              value={companyCode}
              onChange={(event) => setCompanyCode(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="이메일을 입력해주세요."
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
              placeholder="비밀번호를 입력해주세요."
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button type="submit" className={styles.submit} disabled={!canSubmit}>
            로그인
          </button>
        </form>
      </div>
    </div>
  )
}
