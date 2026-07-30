import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  AgentSparkleIcon,
  AuditListIcon,
  CalendarClockIcon,
  ContractIcon,
  FolderCheckIcon,
  GlobeChatIcon,
  LockIcon,
  PersonCheckIcon,
  RadarAlertIcon,
  ShieldIcon,
} from './IntroIcons'
import {
  AGENT_PREVIEW_ITEMS,
  FEATURES,
  INTRO_SECTIONS,
  PREVIEW_METRICS,
  STEPS,
  TRUST_ITEMS,
  type FeatureIconKey,
  type TrustIconKey,
} from './introData'
import styles from './IntroPage.module.css'

const FEATURE_ICONS: Record<FeatureIconKey, ComponentType<{ className?: string }>> = {
  agent: AgentSparkleIcon,
  calendar: CalendarClockIcon,
  contract: ContractIcon,
  folder: FolderCheckIcon,
  globe: GlobeChatIcon,
  radar: RadarAlertIcon,
}

const TRUST_ICONS: Record<TrustIconKey, ComponentType<{ className?: string }>> = {
  person: PersonCheckIcon,
  shield: ShieldIcon,
  lock: LockIcon,
  audit: AuditListIcon,
}

const AGENT_PREVIEW_TONE = {
  '✓': styles.agentPreviewIconSuccess,
  '!': styles.agentPreviewIconWarning,
  '→': styles.agentPreviewIconNext,
} as const

export function IntroPage() {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const [activeSection, setActiveSection] = useState(INTRO_SECTIONS[0].id)

  useEffect(() => {
    const elements = INTRO_SECTIONS.map((section) => sectionRefs.current[section.id]).filter(
      (el): el is HTMLElement => el !== null,
    )

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.inView)
          }
          if (entry.intersectionRatio >= 0.5) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: [0, 0.5] },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function scrollToSection(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className={styles.page}>
      <nav className={styles.dotNav} aria-label="섹션 이동">
        {INTRO_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`${styles.dot} ${activeSection === section.id ? styles.dotActive : ''}`}
            aria-label={section.label}
            aria-current={activeSection === section.id}
            onClick={() => scrollToSection(section.id)}
          />
        ))}
      </nav>

      <div className={styles.scrollContainer}>
        <section
          id="hero"
          ref={(el) => {
            sectionRefs.current.hero = el
          }}
          className={`${styles.section} ${styles.heroSection}`}
        >
          <div className={styles.heroGlow} aria-hidden="true" />

          <div className={styles.topNav}>
            <div className={styles.brandRow}>
              <p className={styles.brand}>FOWOCO</p>
              <p className={styles.tagline}>AI Operations for HR</p>
            </div>
            <div className={styles.navActions}>
              <Link to="/login" className={styles.navLoginLink}>
                로그인
              </Link>
              <Link to="/signup" className={styles.navStartLink}>
                시작하기 →
              </Link>
            </div>
          </div>

          <div className={styles.heroBody}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>AI 기반 HR OPERATIONS</p>
              <h1 className={styles.headline}>
                복잡한 HR 행정업무,
                <br />
                <span className={styles.headlineAccent}>Agent</span>가 준비하고 사람이
                결정합니다.
              </h1>
              <p className={styles.subtext}>
                FOWOCO는 체류·계약·문서 업무를 분석해 필요한 정보와 초안을 준비합니다. 담당자는
                근거를 검토하고 승인하며, 실제 전달과 제출은 직접 수행합니다.
              </p>
              <div className={styles.heroActions}>
                <Link to="/signup" className={styles.heroPrimary}>
                  FOWOCO 시작하기 →
                </Link>
                <Link to="/login" className={styles.heroLoginLink}>
                  로그인
                </Link>
              </div>
              <div className={styles.heroBadgeRow}>
                <span className={styles.heroBadge}>Agent 분석 · 사람 승인</span>
                <span className={styles.heroBadge}>실제 개인정보 없는 Demo</span>
              </div>
            </div>

            <div className={styles.previewFrame}>
              <div className={styles.previewChrome}>
                <span className={styles.previewChromeDots} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className={styles.previewChromeTitle}>FOWOCO · Today</span>
                <span className={styles.previewChromeBadge}>Live Demo</span>
              </div>

              <div className={styles.previewBody}>
                <div className={styles.previewMetricRow}>
                  {PREVIEW_METRICS.map((metric) => (
                    <div key={metric.label} className={styles.previewMetric}>
                      <p className={styles.previewMetricValue}>{metric.value}</p>
                      <p className={styles.previewMetricLabel}>{metric.label}</p>
                    </div>
                  ))}
                </div>

                <div className={styles.agentPreview}>
                  <div className={styles.agentPreviewHeader}>
                    <span className={styles.agentPreviewGlyph} aria-hidden="true">
                      ✨
                    </span>
                    <div>
                      <p className={styles.agentPreviewTitle}>Agent가 먼저 준비한 내용</p>
                      <p className={styles.agentPreviewSubtext}>
                        체류연장 요청을 확인해 필요한 정보와 다음 행동을 정리했습니다.
                      </p>
                    </div>
                  </div>
                  {AGENT_PREVIEW_ITEMS.map((item) => (
                    <div key={item.label} className={styles.agentPreviewRow}>
                      <span
                        className={`${styles.agentPreviewIcon} ${AGENT_PREVIEW_TONE[item.icon]}`}
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                      <span className={styles.agentPreviewLabel}>{item.label}</span>
                      <span className={styles.agentPreviewTag}>{item.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          ref={(el) => {
            sectionRefs.current.features = el
          }}
          className={styles.section}
        >
          <div className={styles.sectionInner}>
            <p className={styles.sectionKicker}>CORE FEATURES</p>
            <h2 className={styles.sectionTitle}>핵심 기능</h2>
            <p className={styles.sectionSubtext}>
              기능을 많이 보여 주기보다, 지금 필요한 업무와 다음 행동을 명확하게 연결합니다.
            </p>
            <div className={styles.featureGrid}>
              {FEATURES.map((feature) => {
                const Icon = FEATURE_ICONS[feature.icon]
                return (
                  <div key={feature.title} className={styles.featureCard}>
                    <div className={styles.featureIconBadge}>
                      <Icon className={styles.featureIcon} />
                    </div>
                    <p className={styles.featureTitle}>{feature.title}</p>
                    <p className={styles.featureDescription}>{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section
          id="steps"
          ref={(el) => {
            sectionRefs.current.steps = el
          }}
          className={`${styles.section} ${styles.stepsSection}`}
        >
          <div className={styles.sectionInner}>
            <p className={styles.sectionKicker}>HOW IT WORKS</p>
            <h2 className={styles.sectionTitle}>업무가 진행되는 방식</h2>
            <div className={styles.stepGrid}>
              {STEPS.map((step, index) => (
                <div key={step.no} className={styles.stepCard}>
                  <div className={styles.stepBadge}>{step.no}</div>
                  <p className={styles.stepTitle}>{step.title}</p>
                  <p className={styles.stepDescription}>{step.description}</p>
                  {index < STEPS.length - 1 && (
                    <span className={styles.stepConnector} aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="trust"
          ref={(el) => {
            sectionRefs.current.trust = el
          }}
          className={styles.section}
        >
          <div className={styles.sectionInner}>
            <p className={styles.sectionKicker}>WHY FOWOCO</p>
            <h2 className={styles.sectionTitle}>자동화보다 중요한 것은 통제와 신뢰입니다.</h2>
            <div className={styles.trustGrid}>
              {TRUST_ITEMS.map((item) => {
                const Icon = TRUST_ICONS[item.icon]
                return (
                  <div key={item.title} className={styles.trustCard}>
                    <div className={styles.trustIconBadge}>
                      <Icon className={styles.trustIcon} />
                    </div>
                    <div>
                      <p className={styles.trustTitle}>{item.title}</p>
                      <p className={styles.trustDescription}>{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section
          id="footer"
          ref={(el) => {
            sectionRefs.current.footer = el
          }}
          className={`${styles.section} ${styles.footerSection}`}
        >
          <div className={styles.footerGlow} aria-hidden="true" />
          <div className={styles.footerInner}>
            <p className={styles.footerHeadline}>지금 바로 FOWOCO를 시작해 보세요.</p>
            <div className={styles.footerActions}>
              <Link to="/signup" className={styles.footerPrimary}>
                FOWOCO 시작하기 →
              </Link>
              <Link to="/login" className={styles.footerSecondary}>
                로그인
              </Link>
            </div>
            <div className={styles.footerDivider} />
            <div className={styles.footerBottomRow}>
              <p className={styles.footerBrand}>FOWOCO · Prototype v3</p>
              <p className={styles.footerLinks}>
                프로젝트 소개 · GitHub · 팀 소개 · 문의하기 · 외부 링크는 Prototype Only
              </p>
              <div className={styles.footerLegalActions}>
                <button type="button" className={styles.footerAction}>
                  개인정보처리방침
                </button>
                <button type="button" className={styles.footerAction}>
                  서비스 이용약관
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
