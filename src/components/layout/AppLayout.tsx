import { NavLink, Outlet } from 'react-router-dom'
import styles from './AppLayout.module.css'
import { NAV_ITEMS } from './navItems'

export function AppLayout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.logo}>FOWOCO</h1>
      </header>

      <nav className={styles.sidebar} aria-label="주요 메뉴">
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

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
