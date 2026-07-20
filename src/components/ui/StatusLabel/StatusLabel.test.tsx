import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusLabel } from './StatusLabel'

describe('StatusLabel', () => {
  it('renders the Korean label for each tone', () => {
    render(
      <>
        <StatusLabel tone="neutral" />
        <StatusLabel tone="warning" />
        <StatusLabel tone="critical" />
        <StatusLabel tone="agent" />
      </>,
    )

    expect(screen.getByText('진행 중')).toBeInTheDocument()
    expect(screen.getByText('확인 필요')).toBeInTheDocument()
    expect(screen.getByText('실행 차단')).toBeInTheDocument()
    expect(screen.getByText('Agent 준비')).toBeInTheDocument()
  })
})
