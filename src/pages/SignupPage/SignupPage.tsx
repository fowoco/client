import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api/client'
import { ApiError, getErrorMessage, type ApiFieldError } from '../../api/errors'
import { fetchSignupPolicy, type SignupPolicy } from '../../api/signupPolicy'
import { Button } from '../../components/ui/Button/Button'
import { Checkbox } from '../../components/ui/Checkbox/Checkbox'
import { EyeIcon, EyeOffIcon } from '../../components/ui/icons/EyeIcons'
import { LockIcon, MailIcon } from '../../components/ui/icons/FieldIcons'
import { markOnboardingImportPending } from '../OnboardingImportPage/onboardingImportStorage'
import { getPasswordStrength } from '../../utils/passwordStrength'
import styles from './SignupPage.module.css'

interface FieldErrors {
  workplace?: string
  name?: string
  phone?: string
  email?: string
  password?: string
  confirmPassword?: string
  terms?: string
}

// fowoco/server SignupResponse (POST /api/v1/auth/signup) 중 화면에서 쓰는 필드만.
interface SignupResponseBody {
  email: string
}

const SERVER_FIELD_TO_SCREEN_FIELD: Record<string, keyof FieldErrors> = {
  company_name: 'workplace',
  display_name: 'name',
  phone: 'phone',
  email: 'email',
  password: 'password',
}

const PHONE_PATTERN = /^[0-9+()\-\s]*$/

function mapServerFieldErrors(fieldErrors: ApiFieldError[]): FieldErrors {
  const mapped: FieldErrors = {}
  for (const fieldError of fieldErrors) {
    const screenField = SERVER_FIELD_TO_SCREEN_FIELD[fieldError.field]
    if (screenField) mapped[screenField] = fieldError.message
  }
  return mapped
}

export function SignupPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [workplace, setWorkplace] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [signupPolicy, setSignupPolicy] = useState<SignupPolicy | null>(null)
  const [policyLoading, setPolicyLoading] = useState(true)
  const [policyError, setPolicyError] = useState<string | null>(null)

  const passwordStrength = getPasswordStrength(password)

  const loadSignupPolicy = useCallback(async () => {
    setPolicyLoading(true)
    setPolicyError(null)
    try {
      setSignupPolicy(await fetchSignupPolicy())
    } catch {
      setSignupPolicy(null)
      setPolicyError('회원가입 정책을 불러오지 못했습니다.')
    } finally {
      setPolicyLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSignupPolicy()
  }, [loadSignupPolicy])

  function validate(): FieldErrors {
    const errors: FieldErrors = {}
    if (!name.trim() || name.trim().length < 2) errors.name = '2자 이상 입력해 주세요.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = '이메일 형식을 확인합니다.'
    if (!workplace.trim()) errors.workplace = '회사명을 입력해 주세요.'
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) {
      errors.phone = '연락처 형식을 확인해 주세요.'
    }
    if (!signupPolicy) {
      errors.terms = '회원가입 정책을 먼저 불러와 주세요.'
    } else if (
      password.length < signupPolicy.password_policy.min_length ||
      password.length > signupPolicy.password_policy.max_length
    ) {
      errors.password = `비밀번호는 ${signupPolicy.password_policy.min_length}자 이상 ${signupPolicy.password_policy.max_length}자 이하여야 합니다.`
    } else if (
      (signupPolicy.password_policy.require_letter && !/[A-Za-z]/.test(password)) ||
      (signupPolicy.password_policy.require_digit && !/\d/.test(password))
    ) {
      errors.password = '비밀번호에는 영문과 숫자가 각각 하나 이상 포함되어야 합니다.'
    }
    if (confirmPassword !== password) errors.confirmPassword = '비밀번호를 다시 입력해 주세요.'
    if (signupPolicy && (!termsAgreed || !privacyAgreed)) {
      errors.terms = '필수 약관에 동의해 주세요.'
    }
    return errors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    if (!signupPolicy) return

    setSubmitting(true)
    try {
      await apiFetch<SignupResponseBody>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          company_name: workplace,
          display_name: name,
          phone: phone.trim() || null,
          email,
          password,
          agreements: {
            service_terms: {
              agreed: termsAgreed,
              version: signupPolicy.agreements.service_terms.version,
            },
            privacy_policy: {
              agreed: privacyAgreed,
              version: signupPolicy.agreements.privacy_policy.version,
            },
            marketing: {
              agreed: marketingOptIn,
              version: signupPolicy.agreements.marketing.version,
            },
          },
        }),
        skipAuthRetry: true,
      })
      markOnboardingImportPending()
      navigate('/login?signup=success')
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        setFieldErrors(mapServerFieldErrors(error.fieldErrors))
      } else if (error instanceof ApiError) {
        setFieldErrors({ email: getErrorMessage(error) })
      } else {
        setFieldErrors({ email: '알 수 없는 오류가 발생했습니다.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <aside className={styles.promo}>
        <p className={styles.brand}>FOWOCO</p>
        <p className={styles.kicker}>CREATE YOUR WORKSPACE</p>
        <h1 className={styles.headline}>
          회사 업무 공간을
          <br />
          안전하게 시작하세요.
        </h1>
        <p className={styles.subtext}>
          계정과 회사 정보를 입력하면 FOWOCO가 검토·승인 중심의 업무 공간을 준비합니다.
        </p>

        <p className={styles.disclaimer}>Agent는 준비하고, 중요한 결정은 사람이 수행합니다.</p>
      </aside>

      <div className={styles.formSide}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <h2 className={styles.title}>FOWOCO 업무 공간 만들기</h2>
          <p className={styles.description}>
            회사 정보를 입력하고 안전한 HR Operations 업무 공간을 시작하세요.
          </p>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              이름
            </label>
            <div
              className={`${styles.inputShell} ${fieldErrors.name ? styles.inputShellError : ''}`}
            >
              <input
                id="name"
                className={styles.input}
                placeholder="김하늘"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <p className={fieldErrors.name ? styles.fieldError : styles.helperText}>
              {fieldErrors.name ?? '2자 이상 입력해 주세요.'}
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              업무용 이메일
            </label>
            <div
              className={`${styles.inputShell} ${fieldErrors.email ? styles.inputShellError : ''}`}
            >
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
            <p className={fieldErrors.email ? styles.fieldError : styles.helperText}>
              {fieldErrors.email ?? '이메일 형식을 확인합니다.'}
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="workplace">
              회사명
            </label>
            <div
              className={`${styles.inputShell} ${fieldErrors.workplace ? styles.inputShellError : ''}`}
            >
              <input
                id="workplace"
                className={styles.input}
                placeholder="FOWOCO 데모 회사"
                value={workplace}
                onChange={(event) => setWorkplace(event.target.value)}
              />
            </div>
            <p className={fieldErrors.workplace ? styles.fieldError : styles.helperText}>
              {fieldErrors.workplace ?? '회사명을 입력해 주세요.'}
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">
              연락처 (선택)
            </label>
            <div
              className={`${styles.inputShell} ${fieldErrors.phone ? styles.inputShellError : ''}`}
            >
              <input
                id="phone"
                type="tel"
                className={styles.input}
                placeholder="010-1234-5678"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            {fieldErrors.phone && <p className={styles.fieldError}>{fieldErrors.phone}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              비밀번호
            </label>
            <div
              className={`${styles.inputShell} ${fieldErrors.password ? styles.inputShellError : ''}`}
            >
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
            <p className={fieldErrors.password ? styles.fieldError : styles.helperText}>
              {fieldErrors.password ??
                `영문과 숫자를 포함해 ${signupPolicy?.password_policy.min_length ?? 8}자 이상 입력해 주세요.`}
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">
              비밀번호 확인
            </label>
            <div
              className={`${styles.inputShell} ${
                fieldErrors.confirmPassword ? styles.inputShellError : ''
              }`}
            >
              <LockIcon className={styles.inputIcon} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="다시 입력"
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
            <p className={fieldErrors.confirmPassword ? styles.fieldError : styles.helperText}>
              {fieldErrors.confirmPassword ?? '비밀번호를 다시 입력해 주세요.'}
            </p>
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

          <div className={styles.termsGroup}>
            {policyLoading && (
              <p className={styles.policyStatus} role="status">
                회원가입 정책을 확인하고 있습니다.
              </p>
            )}
            {policyError && (
              <div className={styles.policyError} role="alert">
                <span>{policyError}</span>
                <button type="button" onClick={() => void loadSignupPolicy()}>
                  다시 시도
                </button>
              </div>
            )}
            <div className={styles.termsRow}>
              <Checkbox
                id="terms-agree"
                label="[필수] 서비스 이용약관 동의"
                checked={termsAgreed}
                disabled={!signupPolicy}
                onChange={(event) => setTermsAgreed(event.target.checked)}
              />
              <Link
                to={signupPolicy?.agreements.service_terms.content_path ?? '/legal/terms'}
                target="_blank"
                rel="noreferrer"
                className={styles.termsLink}
              >
                약관 보기
              </Link>
            </div>
            <div className={styles.termsRow}>
              <Checkbox
                id="privacy-agree"
                label="[필수] 개인정보 수집 및 이용 동의"
                checked={privacyAgreed}
                disabled={!signupPolicy}
                onChange={(event) => setPrivacyAgreed(event.target.checked)}
              />
              <Link
                to={signupPolicy?.agreements.privacy_policy.content_path ?? '/legal/privacy'}
                target="_blank"
                rel="noreferrer"
                className={styles.termsLink}
              >
                개인정보 보기
              </Link>
            </div>
            <div className={styles.termsRow}>
              <Checkbox
                id="marketing-opt-in"
                label="[선택] 제품 소식 수신"
                checked={marketingOptIn}
                disabled={!signupPolicy}
                onChange={(event) => setMarketingOptIn(event.target.checked)}
              />
              <Link
                to={signupPolicy?.agreements.marketing.content_path ?? '/legal/marketing'}
                target="_blank"
                rel="noreferrer"
                className={styles.termsLink}
              >
                수신 안내
              </Link>
            </div>
            {fieldErrors.terms && <p className={styles.fieldError}>{fieldErrors.terms}</p>}
          </div>

          <Button
            type="submit"
            className={styles.submit}
            disabled={!signupPolicy || policyLoading}
            isLoading={submitting}
          >
            계정 만들기
          </Button>

          <p className={styles.loginPrompt}>
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className={styles.loginLink}>
              로그인
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
