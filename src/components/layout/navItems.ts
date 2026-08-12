import agentIcon from './nav-icons/agent.svg'
import documentsIcon from './nav-icons/documents.svg'
import settingsIcon from './nav-icons/settings.svg'
import todayIcon from './nav-icons/today.svg'
import workIcon from './nav-icons/work.svg'
import workersIcon from './nav-icons/workers.svg'

export interface NavItem {
  label: string
  to: string
  iconSrc: string
}

// SettingsPage는 제거되어 "설정" 메뉴는 내 프로필 페이지로 연결된다.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Today', to: '/dashboard', iconSrc: todayIcon },
  { label: '업무함', to: '/tasks', iconSrc: workIcon },
  { label: '근로자', to: '/workers', iconSrc: workersIcon },
  { label: '문서함', to: '/documents', iconSrc: documentsIcon },
  { label: 'Agent 기록', to: '/agent', iconSrc: agentIcon },
  { label: '설정', to: '/profile', iconSrc: settingsIcon },
]
