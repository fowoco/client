import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button/Button'
import { ToastViewport } from '../ui/ToastViewport/ToastViewport'
import styles from './AppLayout.module.css'
import { HelpModal } from './HelpModal/HelpModal'
import { NAV_ITEMS } from './navItems'
import { RouteTransition } from './RouteTransition'

export function AppLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [helpOpen, setHelpOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <p className={styles.brand}>FOWOCO</p>
        <p className={styles.kicker}>OPERATIONS</p>

        <nav className={styles.nav} aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.help} onClick={() => setHelpOpen(true)}>
            ? 도움말
          </button>
          <button type="button" className={styles.logout} onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topBar}>
          {/* TODO(backend): GET /api/me -> 사업장명·담당자명 최신화 */}
          <p className={styles.workspace}>
            {user ? `${user.workplace} · ${user.name} ${user.role}` : ''}
          </p>
          <Button onClick={() => navigate('/tasks/new')}>＋ 업무 만들기</Button>
        </header>

        <main className={styles.content}>
          <RouteTransition />
        </main>
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ToastViewport />
    </div>
  )
}
