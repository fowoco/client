export interface NavItem {
  label: string
  to: string
}

// Figma PWF v3 사이드바(Aside - SideNavBar, 05_Desktop Core Product 전 화면 공통)는 5개 메뉴만
// 정의한다. Agent/티켓 메뉴는 Figma에 없는 화면이라(#206) 링크만 제거하고 라우트는 유지한다.
// SettingsPage는 제거되어 "설정" 메뉴는 내 프로필 페이지로 연결된다.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Today', to: '/dashboard' },
  { label: '업무함', to: '/tasks' },
  { label: '근로자', to: '/workers' },
  { label: '문서함', to: '/documents' },
  { label: '설정', to: '/profile' },
]
