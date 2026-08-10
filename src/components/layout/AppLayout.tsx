import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { OnboardingTour } from '../onboarding/OnboardingTour'
import { hasCompletedOnboarding, markOnboardingCompleted } from '../onboarding/onboardingStorage'
import { ToastViewport } from '../ui/ToastViewport/ToastViewport'
import styles from './AppLayout.module.css'
import { DashboardTodayProvider } from './DashboardTodayProvider'
import { useDashboardToday } from './dashboardTodayContext'
import { HeaderActions } from './HeaderActions/HeaderActions'
import { HelpModal } from './HelpModal/HelpModal'
import { NAV_ITEMS } from './navItems'
import { RouteTransition } from './RouteTransition'

const WORK_SHORTCUTS = [
  { label: '승인 대기', focus: 'pending-approval', countKey: 'pending_approval', tone: 'warning' },
  { label: '정보 보완', focus: 'needs-info', countKey: 'needs_info', tone: 'warning' },
  { label: '응답 대기', focus: 'worker-response', countKey: 'worker_response', tone: 'info' },
  { label: '오늘 마감', focus: 'due-today', countKey: 'due_today', tone: 'critical' },
] as const

function getPageTitle(pathname: string) {
  if (pathname === '/dashboard') return 'Today'
  if (pathname === '/tasks') return '업무함'
  if (pathname === '/tasks/new') return '새 업무 요청'
  if (pathname === '/tasks/new/review') return '업무 검토'
  if (/^\/tasks\/[^/]+$/.test(pathname)) return '업무 상세'
  if (pathname === '/documents') return '문서함'
  if (/^\/documents\/[^/]+$/.test(pathname)) return '문서 상세'
  if (pathname === '/agent') return 'Agent 기록'
  if (pathname === '/profile') return '설정'
  if (pathname === '/workers') return '근로자 정보'
  if (pathname.startsWith('/workers/')) return '근로자 정보'
  if (pathname.startsWith('/tickets/')) return '지원 요청 상세'
  if (pathname === '/tickets') return '지원 요청'
  return 'FOWOCO'
}

export function AppLayout() {
  return (
    <DashboardTodayProvider>
      <AppLayoutShell />
    </DashboardTodayProvider>
  )
}

function AppLayoutShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { status: todayStatus, data: today } = useDashboardToday()
  const [helpOpen, setHelpOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isTaskDetail =
    /^\/tasks\/[^/]+$/.test(location.pathname) && !location.pathname.startsWith('/tasks/new')
  const isWorkInbox = location.pathname === '/tasks'
  const isDashboard = location.pathname === '/dashboard'
  const pageTitle = getPageTitle(location.pathname)

  useEffect(() => {
    if (!hasCompletedOnboarding()) setTourOpen(true)
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname, location.search])

  function handleFinishTour() {
    markOnboardingCompleted()
    setTourOpen(false)
  }

  function handleReplayTour() {
    setHelpOpen(false)
    setTourOpen(true)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function getShortcutCount(countKey: (typeof WORK_SHORTCUTS)[number]['countKey']) {
    if (todayStatus === 'loading') return '…'
    if (todayStatus === 'error' || !today) return '–'
    return today.summary_counts[countKey]
  }

  return (
    <div className={styles.shell}>
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
        aria-label="전역 사이드바"
      >
        <div className={styles.sidebarHeader}>
          <Link to="/dashboard" className={styles.brand} aria-label="FOWOCO Today로 이동">
            <span className={styles.brandMark}>F</span>
            <span className={styles.brandCopy}>
              <strong>FOWOCO</strong>
              <small>HR OPERATIONS</small>
            </span>
          </Link>
          <button
            type="button"
            className={styles.sidebarClose}
            aria-label="사이드바 닫기"
            onClick={() => setSidebarOpen(false)}
          >
            <span aria-hidden="true">×</span>
          </button>
          <div className={styles.agentConnection} title="Agent가 업무를 정리하고 있습니다">
            <span aria-hidden="true" />
            <em>Agent 운영 중</em>
          </div>
        </div>

        <div className={styles.sidebarBody}>
          <nav className={styles.nav} aria-label="주요 메뉴">
            <p className={styles.sidebarLabel}>업무 공간</p>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                <img src={item.iconSrc} alt="" className={styles.navIcon} aria-hidden="true" />
                <span className={styles.navText}>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <section className={styles.shortcutSection} aria-labelledby="work-shortcut-title">
            <p id="work-shortcut-title" className={styles.sidebarLabel}>
              업무 바로가기
            </p>
            <div className={styles.shortcutList}>
              {WORK_SHORTCUTS.map((shortcut) => (
                <Link
                  key={shortcut.focus}
                  to={`/tasks?focus=${shortcut.focus}`}
                  title={`${shortcut.label} 업무 보기`}
                  className={styles.shortcutLink}
                >
                  <span
                    className={`${styles.shortcutDot} ${styles[`shortcutDot_${shortcut.tone}`]}`}
                    aria-hidden="true"
                  />
                  <span className={styles.shortcutText}>{shortcut.label}</span>
                  <strong>{getShortcutCount(shortcut.countKey)}</strong>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.help} onClick={() => setHelpOpen(true)}>
            <span aria-hidden="true">?</span>
            <span className={styles.footerText}>도움말</span>
          </button>
          <Link to="/profile" className={styles.workplace} title={user?.workplace ?? '회사 정보'}>
            <span className={styles.workplaceAvatar} aria-hidden="true">
              {user?.workplace?.slice(0, 1) ?? 'F'}
            </span>
            <span className={styles.workplaceCopy}>
              <strong>{user?.workplace ?? '회사 정보'}</strong>
              <small>{user?.role ?? 'HR'}</small>
            </span>
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className={styles.sidebarBackdrop}
          aria-label="사이드바 닫기"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={styles.workspace}>
        <header className={styles.topBar}>
          <div className={styles.topBarContext}>
            <button
              type="button"
              className={styles.sidebarTrigger}
              aria-label="사이드바 열기"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
            {isTaskDetail && (
              <Link to="/tasks" className={styles.topBarBack}>
                업무함
              </Link>
            )}
            {isTaskDetail && <span className={styles.breadcrumbSeparator}>/</span>}
            <strong className={styles.pageTitle}>{pageTitle}</strong>
          </div>

          <HeaderActions user={user} onLogout={handleLogout} />
        </header>

        <main
          className={`${styles.content} ${isWorkInbox ? styles.contentWorkInbox : ''} ${
            isDashboard ? styles.contentDashboard : ''
          }`}
        >
          <div className={styles.contentInner}>
            <RouteTransition />
          </div>
        </main>
      </div>

      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onReplayTour={handleReplayTour}
      />
      <OnboardingTour open={tourOpen} onFinish={handleFinishTour} />
      <ToastViewport />
    </div>
  )
}
