import {
  useCallback,
  useState,
  type PropsWithChildren,
} from 'react'
import { fetchDashboardToday, type DashboardTodayResponse } from '../../api/dashboard'
import { useApiQuery } from '../../hooks/useApiQuery'
import { DashboardTodayContext } from './dashboardTodayContext'

function isDashboardTodayEmpty(today: DashboardTodayResponse) {
  return (
    today.priority_tasks.length === 0 &&
    today.upcoming_7_days.length === 0 &&
    today.recommendations.connected_count === 0 &&
    Object.values(today.summary_counts).every((count) => count === 0)
  )
}

export function DashboardTodayProvider({ children }: PropsWithChildren) {
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const fetcher = useCallback(async () => {
    const response = await fetchDashboardToday('Asia/Seoul')
    setLastUpdatedAt(
      new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date()),
    )
    return response
  }, [])
  const isEmpty = useCallback(isDashboardTodayEmpty, [])
  const query = useApiQuery(fetcher, isEmpty)
  const value = { ...query, lastUpdatedAt }

  return <DashboardTodayContext.Provider value={value}>{children}</DashboardTodayContext.Provider>
}
