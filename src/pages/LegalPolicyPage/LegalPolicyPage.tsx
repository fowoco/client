import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSignupPolicy } from '../../api/signupPolicy'
import styles from './LegalPolicyPage.module.css'

type PolicyKind = 'terms' | 'privacy'

interface LegalPolicyPageProps {
  kind: PolicyKind
}

const TERMS_SECTIONS = [
  {
    title: '1. 서비스 목적',
    body: 'FOWOCO는 외국인 근로자 관련 HR 행정업무의 기한 확인, 문서 초안 작성, 안내와 응답 추적을 지원하는 업무보조 서비스입니다.',
  },
  {
    title: '2. 계정과 사업장 정보',
    body: '사용자는 정확한 사업장 정보를 입력하고 계정 접근수단을 안전하게 관리해야 합니다. 계정으로 수행된 업무 검토와 승인 결과는 해당 사업장의 행위로 기록됩니다.',
  },
  {
    title: '3. AI 업무보조의 범위',
    body: 'AI가 생성한 분류, 체크리스트, 문서와 안내문은 담당자 검토를 위한 초안입니다. 기관 제출, 법적 판단, 급여 계산과 최종 승인은 담당자가 확인하고 수행합니다.',
  },
  {
    title: '4. 금지 행위',
    body: '타인의 계정이나 개인정보를 무단으로 사용하거나, 서비스 안정성을 해치거나, 허위·위법한 목적으로 서비스를 이용할 수 없습니다.',
  },
  {
    title: '5. 서비스 변경과 제한',
    body: '프로젝트 검증 과정에서 기능과 제공 범위가 변경될 수 있습니다. 점검이나 장애가 발생하면 일부 기능이 일시적으로 제한될 수 있습니다.',
  },
]

const PRIVACY_SECTIONS = [
  {
    title: '1. 처리하는 정보',
    body: '회원가입 시 회사명, 담당자 이름, 업무용 이메일, 비밀번호의 해시값과 선택 입력한 연락처를 처리합니다. 사업장이 업로드한 근로자 문서와 업무 이력은 서비스 제공 범위에서만 처리합니다.',
  },
  {
    title: '2. 이용 목적',
    body: '계정 인증, 사업장 업무 공간 제공, 문서·기한 관리, 근로자 안내와 응답 연결, 오류 조사와 감사 이력 확인을 위해 정보를 사용합니다.',
  },
  {
    title: '3. 보관과 접근',
    body: '정보는 프로젝트 운영과 서비스 검증에 필요한 기간 동안 보관하며, 사업장 권한과 역할에 따라 접근 범위를 제한합니다. 비밀번호 원문은 저장하지 않습니다.',
  },
  {
    title: '4. 외부 처리와 전송',
    body: 'OCR, 번역, 알림 등 외부 제공자를 사용하는 기능은 필요한 정보만 전달하도록 구성합니다. 실제 민감정보 사용 전에는 사업장 정책과 제공자 조건을 별도로 확인해야 합니다.',
  },
  {
    title: '5. 이용자 권리',
    body: '사용자는 자신의 계정 정보 확인과 정정을 요청할 수 있습니다. 동의 철회와 삭제 절차는 정식 서비스 전환 시 운영 정책과 함께 확정합니다.',
  },
]

export function LegalPolicyPage({ kind }: LegalPolicyPageProps) {
  const isTerms = kind === 'terms'
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS
  const title = isTerms ? '서비스 이용약관' : '개인정보 처리 안내'
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void fetchSignupPolicy()
      .then((policy) => {
        if (!active) return
        setVersion(
          isTerms
            ? policy.agreements.service_terms.version
            : policy.agreements.privacy_policy.version,
        )
      })
      .catch(() => {
        if (active) setVersion(null)
      })

    return () => {
      active = false
    }
  }, [isTerms])

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          FOWOCO
        </Link>
        <nav className={styles.nav} aria-label="법적 고지">
          <Link to="/legal/terms" aria-current={isTerms ? 'page' : undefined}>
            이용약관
          </Link>
          <Link to="/legal/privacy" aria-current={!isTerms ? 'page' : undefined}>
            개인정보
          </Link>
        </nav>
      </header>

      <article className={styles.document}>
        <p className={styles.eyebrow}>FOWOCO PROJECT POLICY</p>
        <h1>{title}</h1>
        <p className={styles.summary}>
          KT AIVLE School 빅프로젝트의 FOWOCO 프로토타입 운영 기준입니다.
        </p>
        <p className={styles.meta}>
          {version ? `버전 ${version}` : '현재 버전 확인 중'} · 시행일 2026년 8월 19일
        </p>

        <div className={styles.notice}>
          실제 사업장 도입 전 법률·노무 검토와 정식 운영 정책 확정이 필요한 프로젝트 안내입니다.
        </div>

        <div className={styles.sections}>
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>

        <footer className={styles.documentFooter}>
          <Link to="/signup">회원가입으로 돌아가기</Link>
        </footer>
      </article>
    </main>
  )
}
