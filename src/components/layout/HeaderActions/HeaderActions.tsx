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
          <svg
            className={styles.bellIcon}
            aria-hidden="true"
            viewBox="0 0 23.431 23.25"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M17.931 11C19.3897 11 20.7886 10.4205 21.8201 9.38909C22.8515 8.35764 23.431 6.95869 23.431 5.5C23.431 4.04131 22.8515 2.64236 21.8201 1.61091C20.7886 0.579463 19.3897 0 17.931 0C16.4723 0 15.0734 0.579463 14.0419 1.61091C13.0105 2.64236 12.431 4.04131 12.431 5.5C12.431 6.95869 13.0105 8.35764 14.0419 9.38909C15.0734 10.4205 16.4723 11 17.931 11ZM19.681 12.795V13.669L21.797 17.381L22.863 19.25H0L1.065 17.381L3.181 13.669V9C3.18092 7.85974 3.41721 6.73185 3.87496 5.6875C4.33271 4.64316 5.00198 3.70505 5.84053 2.93237C6.67907 2.15969 7.66869 1.56923 8.74691 1.19826C9.82514 0.827281 10.9686 0.683844 12.105 0.777C11.5011 1.52056 11.0452 2.37292 10.762 3.288C9.36242 3.4522 8.07187 4.12463 7.13539 5.17762C6.19891 6.23061 5.68171 7.59082 5.682 9V14.331L5.517 14.619L4.303 16.75H18.56L17.345 14.62L17.181 14.331V12.963C18.0179 13.0457 18.8627 12.9889 19.681 12.795ZM13.431 23.25H9.431V20.75H13.431V23.25Z"
            />
          </svg>
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
          <span className={styles.profileLabel}>{user ? `${user.name} ${user.role}` : ''}</span>
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
