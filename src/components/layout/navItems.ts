export interface NavItem {
  label: string
  to: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: '대시보드', to: '/dashboard' },
  { label: '근로자', to: '/workers' },
  { label: '서류', to: '/documents' },
  { label: '업무카드', to: '/tasks' },
  { label: '티켓', to: '/tickets' },
]
