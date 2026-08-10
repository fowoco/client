export function getSafeNotificationRoute(route: string) {
  if (!route.startsWith('/') || route.startsWith('//')) return '/dashboard'
  const pathname = route.split(/[?#]/, 1)[0]
  const allowedRoots = ['/dashboard', '/tasks', '/workers', '/documents']
  return allowedRoots.some((root) => pathname === root || pathname.startsWith(`${root}/`))
    ? route
    : '/dashboard'
}

