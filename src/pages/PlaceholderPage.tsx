interface PlaceholderPageProps {
  title: string
  issueUrl: string
}

export function PlaceholderPage({ title, issueUrl }: PlaceholderPageProps) {
  return (
    <section>
      <h1>{title}</h1>
      <p>
        구현 예정. 진행 상황은{' '}
        <a href={issueUrl} target="_blank" rel="noreferrer">
          해당 Issue
        </a>
        를 참고하세요.
      </p>
    </section>
  )
}
