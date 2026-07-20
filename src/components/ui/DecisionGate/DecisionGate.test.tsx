import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DecisionGate } from './DecisionGate'

describe('DecisionGate', () => {
  it('renders the message for each state', () => {
    render(
      <>
        <DecisionGate state="locked" />
        <DecisionGate state="ready" />
        <DecisionGate state="approved" />
      </>,
    )

    expect(screen.getByText('실행할 수 없습니다')).toBeInTheDocument()
    expect(screen.getByText('HR 확인이 필요합니다')).toBeInTheDocument()
    expect(screen.getByText('승인이 완료되었습니다')).toBeInTheDocument()
  })
})
