/** 감사 이벤트 시각을 "오늘 HH:MM" / "어제 HH:MM" / "YYYY-MM-DD HH:MM"로 표시한다. */
export function formatEventTime(iso: string): string {
  const date = new Date(iso)
  const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  if (date >= startOfToday) return `오늘 ${hhmm}`
  if (date >= startOfYesterday) return `어제 ${hhmm}`

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d} ${hhmm}`
}
