import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { OnboardingTour } from '../onboarding/OnboardingTour'
import { hasCompletedOnboarding, markOnboardingCompleted } from '../onboarding/onboardingStorage'
import { useAuthStore } from '../../store/authStore'
import { ToastViewport } from '../ui/ToastViewport/ToastViewport'
import styles from './AppLayout.module.css'
import { HeaderActions } from './HeaderActions/HeaderActions'
import { HelpModal } from './HelpModal/HelpModal'
import { NAV_ITEMS } from './navItems'
import { RouteTransition } from './RouteTransition'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [helpOpen, setHelpOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const isTaskDetail = /^\/tasks\/[^/]+$/.test(location.pathname)
  const isWorkInbox = location.pathname === '/tasks'
  const isDashboard = location.pathname === '/dashboard'

  useEffect(() => {
    if (!hasCompletedOnboarding()) setTourOpen(true)
  }, [])

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

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div className={styles.topBarBrandGroup}>
          <span className={styles.brand}>FOWOCO</span>
          <nav className={styles.nav} aria-label="주요 메뉴">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                <img src={item.iconSrc} alt="" className={styles.navIcon} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {isTaskDetail && (
          <Link to="/tasks" className={styles.topBarBack}>
            ← 업무함
          </Link>
        )}

        <div className={styles.topBarActions}>
          <button type="button" className={styles.help} onClick={() => setHelpOpen(true)}>
            ? 도움말
          </button>
          <HeaderActions user={user} onLogout={handleLogout} />
        </div>
      </header>

      <main
        className={`${styles.content} ${isWorkInbox ? styles.contentWorkInbox : ''} ${
          isDashboard ? styles.contentDashboard : ''
        }`}
      >
        <RouteTransition />
      </main>

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
