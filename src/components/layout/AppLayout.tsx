import { NavLink, Outlet } from 'react-router-dom'
import { Button } from '../ui/Button/Button'
import styles from './AppLayout.module.css'
import { NAV_ITEMS } from './navItems'

export function AppLayout() {
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

        <button type="button" className={styles.help}>
          ? 도움말
        </button>
      </aside>

      <div className={styles.main}>
        <header className={styles.topBar}>
          {/* TODO(backend): GET /api/me -> 사업장명·담당자명 표시로 교체 */}
          <p className={styles.workspace}>한빛정밀 · 김민지 HR</p>
          <Button>＋ 업무 만들기</Button>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
