import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AgentSummary } from './AgentSummary'

describe('AgentSummary', () => {
  it('renders headline, body, and action', () => {
    render(
      <AgentSummary
        headline="체류연장 업무 1건에서 여권 사본이 부족합니다."
        body="근로자 요청문과 72시간 보안 링크를 준비했습니다."
        actionLabel="다음 행동 · 요청문 검토"
      />,
    )

    expect(
      screen.getByText('체류연장 업무 1건에서 여권 사본이 부족합니다.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음 행동 · 요청문 검토' })).toBeInTheDocument()
  })
})
