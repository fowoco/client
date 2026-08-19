import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSignupPolicy } from '../../api/signupPolicy'
import styles from './LegalPolicyPage.module.css'

type PolicyKind = 'terms' | 'privacy' | 'marketing'

interface LegalPolicyPageProps {
  kind: PolicyKind
}

interface PolicySection {
  title: string
  paragraphs: string[]
  items?: string[]
  note?: string
}

interface PolicyDocument {
  title: string
  summary: string
  agreementKey: 'service_terms' | 'privacy_policy' | 'marketing'
  sections: PolicySection[]
}

const POLICY_DOCUMENTS: Record<PolicyKind, PolicyDocument> = {
  terms: {
    title: '서비스 이용약관',
    summary: 'FOWOCO 계정과 AI 업무보조 기능을 이용할 때 적용되는 기본 운영 기준입니다.',
    agreementKey: 'service_terms',
    sections: [
      {
        title: '1. 목적과 적용 범위',
        paragraphs: [
          '이 약관은 FOWOCO가 제공하는 외국인 근로자 HR 업무보조 기능의 이용 조건과 사용자 및 서비스 운영 주체의 책임 범위를 정합니다.',
          'FOWOCO는 KT AIVLE School 빅프로젝트에서 개발한 검증용 프로토타입이며, 실제 사업장 도입 전 별도의 법률·노무 검토가 필요합니다.',
        ],
      },
      {
        title: '2. 계정과 사업장 정보',
        paragraphs: [
          '사용자는 본인과 사업장의 정확한 정보를 입력하고 비밀번호 등 계정 접근수단을 안전하게 관리해야 합니다.',
          '사업장 계정에서 수행된 문서 검토, 승인, 근로자 안내와 상태 변경은 해당 사업장의 업무 이력으로 기록될 수 있습니다.',
        ],
      },
      {
        title: '3. AI 업무보조의 범위',
        paragraphs: [
          'AI가 제공하는 Intent 분류, 필수정보 확인, 체크리스트, 문서와 안내문은 담당자 검토를 위한 초안입니다.',
          '기관 제출, 법적 판단, 급여 계산, 근로조건 확정과 외부 발송의 최종 책임은 권한을 가진 담당자에게 있습니다.',
        ],
      },
      {
        title: '4. 문서 업로드와 결과물 이용',
        paragraphs: [
          '사용자는 업무 처리 권한이 있는 문서만 업로드해야 하며, 업로드 전 개인정보 처리 근거와 사내 권한을 확인해야 합니다.',
          'OCR 추출값과 HWPX 초안은 원본 문서와 대조한 뒤 사용해야 하며, 생성 결과를 검토 없이 기관에 제출해서는 안 됩니다.',
        ],
      },
      {
        title: '5. 근로자 안내와 응답',
        paragraphs: [
          '근로자용 링크와 다국어 안내는 담당자가 승인한 내용의 전달과 응답 회수를 지원합니다.',
          '번역 결과는 날짜·금액·문서명 등 핵심 정보가 보존되었는지 담당자가 최종 확인해야 합니다.',
        ],
      },
      {
        title: '6. 금지 행위',
        paragraphs: ['다음 행위는 허용되지 않습니다.'],
        items: [
          '타인의 계정 또는 개인정보를 권한 없이 사용하는 행위',
          '허위 문서를 생성하거나 위법한 목적으로 서비스를 이용하는 행위',
          '서비스의 접근 통제, 파일 검증 또는 감사기록을 우회하는 행위',
          '서비스의 안정성을 해치거나 비정상적인 부하를 발생시키는 행위',
        ],
      },
      {
        title: '7. 서비스 변경과 제한',
        paragraphs: [
          '프로젝트 검증 과정에서 기능, 지원 문서와 제공 범위가 변경될 수 있습니다. 점검, 장애 또는 보안상 필요한 경우 일부 기능이 일시적으로 제한될 수 있습니다.',
        ],
      },
      {
        title: '8. 책임의 제한',
        paragraphs: [
          'FOWOCO는 행정업무 준비와 검토를 보조하며 특정 기관의 접수 또는 허가 결과를 보장하지 않습니다.',
          '사용자가 입력한 정보, 업로드한 원본 또는 담당자 검토의 오류로 발생한 결과는 프로젝트의 보증 범위에 포함되지 않습니다.',
        ],
      },
      {
        title: '9. 문의와 정책 변경',
        paragraphs: [
          '약관 변경 시 시행일과 주요 변경 내용을 서비스 화면에 알립니다. 프로젝트 관련 문의는 FOWOCO 팀의 공식 안내 채널을 통해 접수합니다.',
        ],
      },
    ],
  },
  privacy: {
    title: '개인정보 처리 안내',
    summary: '회원·사업장·근로자 정보와 업로드 문서를 처리하는 범위와 보호 기준입니다.',
    agreementKey: 'privacy_policy',
    sections: [
      {
        title: '1. 처리 원칙과 역할',
        paragraphs: [
          'FOWOCO는 서비스 제공에 필요한 최소 범위에서 정보를 처리하고, 사업장·역할·업무 단위로 접근 범위를 제한합니다.',
          '사업장은 근로자 정보를 등록하거나 문서를 업로드하기 전에 적법한 처리 근거와 담당자의 업무 권한을 확인해야 합니다.',
        ],
      },
      {
        title: '2. 처리하는 정보',
        paragraphs: ['서비스 이용 과정에서 다음 정보가 처리될 수 있습니다.'],
        items: [
          '회원 정보: 회사명, 담당자 이름, 업무용 이메일, 선택 입력 연락처, 비밀번호 해시값',
          '근로자 정보: 성명, 국적·언어, 체류·계약 일정, 담당 업무와 응답 상태',
          '문서 정보: 여권·외국인등록증·계약서 등 사용자가 업로드한 파일과 OCR 추출값',
          '운영 정보: 접속기록, 업무 상태 변경, 승인·다운로드·업로드 감사 이벤트',
        ],
      },
      {
        title: '3. 이용 목적',
        paragraphs: [
          '계정 인증, 사업장 업무 공간 제공, 기한 감지, 문서 초안 작성, 근로자 안내와 응답 연결, 장애 조사와 감사 이력 확인을 위해 정보를 사용합니다.',
        ],
      },
      {
        title: '4. 최소 수집과 화면 표시',
        paragraphs: [
          '목록 화면에는 업무 판단에 필요한 최소 정보만 표시하고, 상세 개인정보는 권한이 있는 사용자가 필요한 단계에서만 확인하도록 구성합니다.',
          '비밀번호 원문은 저장하지 않으며, 화면·로그·오류 응답에서 민감정보가 불필요하게 노출되지 않도록 제한합니다.',
        ],
      },
      {
        title: '5. 업로드 문서의 검증과 저장',
        paragraphs: [
          '일반 문서와 근로자 제출 파일은 파일당 최대 20MB, 근로자 일괄등록 CSV·XLSX 파일은 최대 5MB로 제한합니다.',
          '파일 확장자와 MIME 유형을 허용 목록으로 검사하며, HWP·HWPX는 파일 서명과 내부 구조를 추가 확인합니다. 저장 시 원본 파일명 대신 임의 식별자를 사용하고 정규화된 저장 경로 밖으로 벗어나는 요청을 차단합니다.',
          '파일 접근은 사업장, 담당 업무와 근로자 범위로 제한하고 업로드·다운로드 행위를 감사 이벤트로 기록합니다.',
        ],
        note: '이미지·PDF의 정밀 파일 서명 검사와 악성코드 탐지는 정식 운영 전 추가할 보안 고도화 항목입니다.',
      },
      {
        title: '6. OCR·번역·알림 처리',
        paragraphs: [
          'OCR, 번역, 문자 알림 등 외부 처리 기능에는 해당 작업에 필요한 정보만 전달하는 것을 원칙으로 합니다.',
          '실제 민감정보를 외부 제공자에게 전송하기 전에는 제공 항목, 처리 위치, 보관 조건과 사업장 정책을 별도로 확인해야 합니다.',
        ],
      },
      {
        title: '7. 접근 권한과 감사기록',
        paragraphs: [
          '인증된 사용자에게 역할 기반 권한을 적용하고, 변경 API와 주요 파일 작업에는 수행 주체와 시점을 기록합니다.',
          '근로자용 보안 링크는 허용된 업무와 유효기간 안에서만 사용할 수 있도록 제한합니다.',
        ],
      },
      {
        title: '8. 보관과 삭제',
        paragraphs: [
          '정보는 프로젝트 운영과 서비스 검증에 필요한 기간 동안 보관합니다. 계정 또는 업무 종료 후의 구체적인 보관기간과 파기 절차는 정식 서비스 전환 시 확정합니다.',
          '삭제 요청이 접수되면 관련 법령 또는 분쟁 대응을 위해 보관해야 하는 범위를 제외하고 처리 상태를 확인합니다.',
        ],
      },
      {
        title: '9. 이용자의 권리',
        paragraphs: [
          '사용자는 자신의 계정 정보 확인과 정정을 요청할 수 있으며, 선택 동의는 철회할 수 있습니다.',
          '근로자 정보의 열람·정정·삭제 요청은 해당 정보를 등록한 사업장 담당자를 통해 처리하는 것을 원칙으로 합니다.',
        ],
      },
      {
        title: '10. 안전성 확보 조치',
        paragraphs: [
          '비밀번호 해시 저장, 역할 기반 접근 통제, 파일 형식·크기 검증, 경로 이탈 차단과 감사기록을 기본 보호조치로 적용합니다.',
          '현재 프로젝트는 더미·합성 데이터를 우선 사용하며, 실제 운영 전 HTTPS 강제, 취약점 점검과 보관·파기 정책 검증이 필요합니다.',
        ],
      },
      {
        title: '11. 변경과 문의',
        paragraphs: [
          '처리 항목 또는 외부 제공자가 변경되는 경우 시행 전에 주요 내용을 알립니다. 개인정보 관련 문의는 FOWOCO 팀의 공식 안내 채널을 통해 접수합니다.',
        ],
      },
    ],
  },
  marketing: {
    title: '제품 소식 수신 안내',
    summary: 'FOWOCO의 기능 업데이트와 파일럿 소식 수신에 관한 선택 동의 기준입니다.',
    agreementKey: 'marketing',
    sections: [
      {
        title: '1. 수신 목적',
        paragraphs: [
          '신규 기능, 파일럿 참여, 서비스 점검과 설문 등 FOWOCO 프로젝트 관련 소식을 안내하기 위해 사용합니다.',
        ],
      },
      {
        title: '2. 이용 정보',
        paragraphs: ['담당자 이름, 업무용 이메일과 선택 입력한 연락처를 사용합니다.'],
      },
      {
        title: '3. 수신 방법',
        paragraphs: ['이메일 또는 문자 등 사용자가 제공하고 동의한 채널로 안내할 수 있습니다.'],
      },
      {
        title: '4. 보관과 철회',
        paragraphs: [
          '동의 철회 또는 프로젝트 종료 시까지 보관하며, 사용자는 언제든 수신 동의를 철회할 수 있습니다.',
        ],
      },
      {
        title: '5. 선택 동의의 영향',
        paragraphs: [
          '제품 소식 수신에 동의하지 않아도 회원가입과 기본 서비스 이용에는 제한이 없습니다.',
        ],
      },
    ],
  },
}

function sectionId(title: string) {
  return `section-${title.split('.')[0]}`
}

export function LegalPolicyPage({ kind }: LegalPolicyPageProps) {
  const document = POLICY_DOCUMENTS[kind]
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void fetchSignupPolicy()
      .then((policy) => {
        if (!active) return
        setVersion(policy.agreements[document.agreementKey].version)
      })
      .catch(() => {
        if (active) setVersion(null)
      })

    return () => {
      active = false
    }
  }, [document.agreementKey])

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          FOWOCO
        </Link>
        <nav className={styles.nav} aria-label="법적 고지">
          <Link to="/legal/terms" aria-current={kind === 'terms' ? 'page' : undefined}>
            이용약관
          </Link>
          <Link to="/legal/privacy" aria-current={kind === 'privacy' ? 'page' : undefined}>
            개인정보
          </Link>
          <Link to="/legal/marketing" aria-current={kind === 'marketing' ? 'page' : undefined}>
            제품 소식
          </Link>
        </nav>
      </header>

      <article className={styles.document}>
        <p className={styles.eyebrow}>FOWOCO PROJECT POLICY</p>
        <h1>{document.title}</h1>
        <p className={styles.summary}>{document.summary}</p>
        <p className={styles.meta}>
          {version ? `버전 ${version}` : '현재 버전 확인 중'} · 시행일 2026년 8월 19일
        </p>

        <div className={styles.notice}>
          실제 사업장 도입 전 법률·노무 검토와 정식 운영 정책 확정이 필요한 프로젝트 안내입니다.
        </div>

        <div className={styles.contentLayout}>
          <nav className={styles.toc} aria-label={`${document.title} 목차`}>
            <strong>목차</strong>
            {document.sections.map((section) => (
              <a key={section.title} href={`#${sectionId(section.title)}`}>
                {section.title}
              </a>
            ))}
          </nav>

          <div className={styles.sections}>
            {document.sections.map((section) => (
              <section id={sectionId(section.title)} key={section.title}>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.items && (
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.note && <p className={styles.sectionNote}>{section.note}</p>}
              </section>
            ))}
          </div>
        </div>

        <footer className={styles.documentFooter}>
          <Link to="/signup">회원가입으로 돌아가기</Link>
        </footer>
      </article>
    </main>
  )
}
