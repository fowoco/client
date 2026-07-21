import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DetailRow } from './DetailRow'

describe('DetailRow', () => {
  it('renders the label and value', () => {
    render(<DetailRow label="담당자" value="김경민" />)
    expect(screen.getByText('담당자')).toBeInTheDocument()
    expect(screen.getByText('김경민')).toBeInTheDocument()
  })

  it('applies a tone class to the value', () => {
    render(<DetailRow label="승인" value="대기" tone="warning" />)
    expect(screen.getByText('대기').className).toMatch(/valueWarning/)
  })
})
