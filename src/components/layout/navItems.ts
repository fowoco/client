export interface NavItem {
  label: string
  to: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Today', to: '/dashboard' },
  { label: '업무함', to: '/tasks' },
  { label: '근로자', to: '/workers' },
  { label: '서류', to: '/documents' },
  { label: 'Agent', to: '/agent' },
  { label: '티켓', to: '/tickets' },
  { label: '설정', to: '/settings' },
]
