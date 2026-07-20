import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WorkflowStep } from './WorkflowStep'

describe('WorkflowStep', () => {
  it('renders the step label for each state', () => {
    render(
      <>
        <WorkflowStep state="pending">근로자에게 서류 요청</WorkflowStep>
        <WorkflowStep state="done">서류 확인 완료</WorkflowStep>
        <WorkflowStep state="blocked">승인이 필요합니다</WorkflowStep>
      </>,
    )

    expect(screen.getByText('근로자에게 서류 요청')).toBeInTheDocument()
    expect(screen.getByText('서류 확인 완료')).toBeInTheDocument()
    expect(screen.getByText('승인이 필요합니다')).toBeInTheDocument()
  })
})
