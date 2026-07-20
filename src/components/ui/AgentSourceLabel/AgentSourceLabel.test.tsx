import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AgentSourceLabel } from './AgentSourceLabel'

describe('AgentSourceLabel', () => {
  it('renders the Korean label for each source', () => {
    render(
      <>
        <AgentSourceLabel source="rule" />
        <AgentSourceLabel source="data" />
        <AgentSourceLabel source="draft" />
        <AgentSourceLabel source="review" />
      </>,
    )

    expect(screen.getByText('등록된 규칙')).toBeInTheDocument()
    expect(screen.getByText('보유 데이터')).toBeInTheDocument()
    expect(screen.getByText('Agent 초안')).toBeInTheDocument()
    expect(screen.getByText('HR 확인')).toBeInTheDocument()
  })
})
