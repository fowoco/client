import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AuthUser } from '../../../store/authStore'
import { HEADER_NOTIFICATIONS } from './headerNotifications'
import styles from './HeaderActions.module.css'

export interface HeaderActionsProps {
  user: AuthUser | null
  onLogout: () => void
}

export function HeaderActions({ user, onLogout }: HeaderActionsProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const unreadCount = HEADER_NOTIFICATIONS.filter((notification) => !notification.read).length

  useEffect(() => {
    if (!notifOpen && !profileOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (notifOpen && !notifRef.current?.contains(event.target as Node)) setNotifOpen(false)
      if (profileOpen && !profileRef.current?.contains(event.target as Node)) setProfileOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setNotifOpen(false)
      setProfileOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [notifOpen, profileOpen])

  function toggleNotif() {
    setProfileOpen(false)
    setNotifOpen((prev) => !prev)
  }

  function toggleProfile() {
    setNotifOpen(false)
    setProfileOpen((prev) => !prev)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.menu} ref={notifRef}>
        <button
          type="button"
          className={styles.bellButton}
          aria-haspopup="true"
          aria-expanded={notifOpen}
          aria-label={unreadCount > 0 ? `알림 ${unreadCount}건 안 읽음` : '알림'}
          onClick={toggleNotif}
        >
          <span aria-hidden="true">🔔</span>
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
        </button>

        {notifOpen && (
          <div className={styles.panel} role="menu">
            <p className={styles.panelTitle}>알림</p>
            {HEADER_NOTIFICATIONS.length === 0 ? (
              <p className={styles.panelEmpty}>새 알림이 없습니다.</p>
            ) : (
              HEADER_NOTIFICATIONS.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notificationRow} ${
                    notification.read ? '' : styles.notificationRowUnread
                  }`}
                >
                  <p className={styles.notificationTitle}>{notification.title}</p>
                  <p className={styles.notificationTime}>{notification.time}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className={styles.menu} ref={profileRef}>
        <button
          type="button"
          className={styles.profileButton}
          aria-haspopup="true"
          aria-expanded={profileOpen}
          onClick={toggleProfile}
        >
          <span className={styles.profileAvatar} aria-hidden="true">
            {user?.name?.slice(0, 1) ?? '?'}
          </span>
          <span className={styles.profileLabel}>
            {user ? `${user.workplace} · ${user.name} ${user.role}` : ''}
          </span>
          <span
            className={`${styles.arrow} ${profileOpen ? styles.arrowOpen : ''}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        {profileOpen && (
          <div className={`${styles.panel} ${styles.profilePanel}`} role="menu">
            <Link to="/profile" className={styles.menuItem} onClick={() => setProfileOpen(false)}>
              내 프로필
            </Link>
            <Link to="/settings" className={styles.menuItem} onClick={() => setProfileOpen(false)}>
              설정
            </Link>
            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                setProfileOpen(false)
                onLogout()
              }}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
