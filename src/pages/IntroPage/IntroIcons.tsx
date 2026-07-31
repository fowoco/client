import type { ReactNode } from 'react'

interface IconProps {
  className?: string
}

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function AgentSparkleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </Svg>
  )
}

export function CalendarClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18M8 3v3M16 3v3" />
      <circle cx="15.5" cy="15.5" r="3.2" />
      <path d="M15.5 14v1.6l1.1 1" />
    </Svg>
  )
}

export function ContractIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14.5 3.5V8h4M8.5 12.5h7M8.5 15.7h7M8.5 18.9h4.5" />
    </Svg>
  )
}

export function FolderCheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5V6.5Z" />
      <path d="m9 14 2 2 4-4" />
    </Svg>
  )
}

export function GlobeChatIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7.5" />
      <path d="M3.5 11h15M11 3.5c2.2 2 3.4 5 3.4 7.5s-1.2 5.5-3.4 7.5c-2.2-2-3.4-5-3.4-7.5S8.8 5.5 11 3.5Z" />
      <path d="M16.5 16.5c1.9.2 3.4 1 3.4 2.3 0 1.5-2.1 2.7-4.7 2.7-.6 0-1.1-.06-1.6-.17l-2.1 1.17.4-1.9c-1-.5-1.6-1.2-1.6-1.9" />
    </Svg>
  )
}

export function RadarAlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3 2" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M12 2.5v2M21.5 12h-2M4.5 12h-2M12 21.5v-2" />
    </Svg>
  )
}

export function PersonCheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9.5" cy="7.5" r="3.5" />
      <path d="M3.5 20c.6-3.6 3.3-6 6-6 1 0 1.9.25 2.7.7" />
      <path d="m14.5 16.5 2 2 3.5-4" />
    </Svg>
  )
}

export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.2 19 6v6c0 4.5-3 7.6-7 8.8-4-1.2-7-4.3-7-8.8V6l7-2.8Z" />
      <path d="m9.2 12 2 2 3.6-4" />
    </Svg>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
      <path d="M12 14.5v3" />
    </Svg>
  )
}

export function WorkerAddIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3.5 20c.6-3.6 3.2-6.2 6.5-6.2 1 0 1.9.2 2.7.6" />
      <path d="M18 9v6M15 12h6" />
    </Svg>
  )
}

export function PayrollIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M7 14h4M7 16.5h2.5" />
      <circle cx="16.5" cy="14.5" r="2.2" />
    </Svg>
  )
}

export function ExitDocIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 3.5H6.5a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1H17a1 1 0 0 0 1-1V9L13 3.5Z" />
      <path d="M13 3.5V9h5" />
      <path d="M9.5 14.5h4M9.5 17.2h4" />
    </Svg>
  )
}

export function InstructionIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z" />
      <path d="M8.5 11.5h7M8.5 14.5h7M8.5 17.5h4.5" />
    </Svg>
  )
}

export function AuditListIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14.5 3.5V8h4" />
      <path d="m8.3 13 1.2 1.2 2.2-2.4M8.3 17.4l1.2 1.2 2.2-2.4" />
    </Svg>
  )
}
