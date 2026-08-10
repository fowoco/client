import { createContext, useContext } from 'react'
import type { DashboardTodayResponse } from '../../api/dashboard'
import type { UseApiQueryResult } from '../../hooks/useApiQuery'

export interface DashboardTodayContextValue extends UseApiQueryResult<DashboardTodayResponse> {
  lastUpdatedAt: string | null
}

export const DashboardTodayContext = createContext<DashboardTodayContextValue | null>(null)

export function useDashboardToday() {
  const context = useContext(DashboardTodayContext)
  if (!context) {
    throw new Error('useDashboardToday must be used within DashboardTodayProvider')
  }
  return context
}
