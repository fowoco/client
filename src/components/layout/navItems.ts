import documentsIcon from './nav-icons/documents.svg'
import settingsIcon from './nav-icons/settings.svg'
import todayIcon from './nav-icons/today.svg'
import workIcon from './nav-icons/work.svg'

export interface NavItem {
  label: string
  to: string
  iconSrc: string
}

// 공용 사이드바에는 주요 운영 진입점만 노출한다. 근로자 기능은 업무·문서 흐름에서
// 컨텍스트로 진입하므로 전역 탭에서는 제외하고, 딥링크와 관련 라우트는 유지한다.
// SettingsPage는 제거되어 "설정" 메뉴는 내 프로필 페이지로 연결된다.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Today', to: '/dashboard', iconSrc: todayIcon },
  { label: '업무함', to: '/tasks', iconSrc: workIcon },
  { label: '문서함', to: '/documents', iconSrc: documentsIcon },
  { label: '설정', to: '/profile', iconSrc: settingsIcon },
]
