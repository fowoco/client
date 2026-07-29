import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OnboardingTour } from './OnboardingTour'
import { ONBOARDING_STEPS } from './onboardingSteps'

describe('OnboardingTour', () => {
  it('renders nothing when closed', () => {
    render(<OnboardingTour open={false} onFinish={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the first step with no "이전" button', () => {
    render(<OnboardingTour open onFinish={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: ONBOARDING_STEPS[0].title })).toBeInTheDocument()
    expect(screen.getByText(ONBOARDING_STEPS[0].body)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '이전' })).not.toBeInTheDocument()
  })

  it('navigates forward and back through steps', async () => {
    const user = userEvent.setup()
    render(<OnboardingTour open onFinish={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(screen.getByRole('dialog', { name: ONBOARDING_STEPS[1].title })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '이전' }))
    expect(screen.getByRole('dialog', { name: ONBOARDING_STEPS[0].title })).toBeInTheDocument()
  })

  it('shows "시작하기" on the last step and calls onFinish', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    render(<OnboardingTour open onFinish={onFinish} />)

    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(screen.getByRole('dialog', { name: ONBOARDING_STEPS[2].title })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '시작하기' }))

    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it('calls onFinish when skipped from any step', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    render(<OnboardingTour open onFinish={onFinish} />)

    await user.click(screen.getByRole('button', { name: '건너뛰기' }))

    expect(onFinish).toHaveBeenCalledTimes(1)
  })
})
