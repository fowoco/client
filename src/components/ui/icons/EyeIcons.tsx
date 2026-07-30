interface IconProps {
  className?: string
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" />
      <circle cx="10" cy="10" r="2.6" />
    </svg>
  )
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 2.5l15 15" />
      <path d="M8.3 4.2C8.85 4.07 9.42 4 10 4c5.5 0 8.5 6 8.5 6a15.6 15.6 0 0 1-3 3.7M5.4 5.5C3 7.1 1.5 10 1.5 10s3 6 8.5 6c1 0 1.9-.16 2.7-.44" />
      <path d="M8.1 8.1a2.6 2.6 0 0 0 3.7 3.7" />
    </svg>
  )
}
