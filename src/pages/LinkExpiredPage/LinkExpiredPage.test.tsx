import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LinkExpiredPage } from './LinkExpiredPage'

describe('LinkExpiredPage', () => {
  it('renders the expired message and contact card', () => {
    render(<LinkExpiredPage />)

    expect(screen.getByText('이 링크는 만료되었습니다.')).toBeInTheDocument()
    expect(screen.getByText('한빛정밀 인사팀 · 김경민')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '재발급 요청 문구 복사' })).toBeInTheDocument()
  })
})
