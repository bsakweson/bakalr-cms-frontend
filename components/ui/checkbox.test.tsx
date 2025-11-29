import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from './checkbox'

describe('Checkbox Component', () => {
  it('renders checkbox', () => {
    const { container } = render(<Checkbox />)
    const checkbox = container.querySelector('button[role="checkbox"]')
    expect(checkbox).toBeInTheDocument()
  })

  it('can be checked', async () => {
    const user = userEvent.setup()
    const { container } = render(<Checkbox />)
    const checkbox = container.querySelector('button[role="checkbox"]') as HTMLElement
    
    await user.click(checkbox)
    expect(checkbox).toHaveAttribute('data-state', 'checked')
  })

  it('can be disabled', () => {
    const { container } = render(<Checkbox disabled />)
    const checkbox = container.querySelector('button[role="checkbox"]')
    expect(checkbox).toBeDisabled()
  })

  it('accepts defaultChecked prop', () => {
    const { container } = render(<Checkbox defaultChecked />)
    const checkbox = container.querySelector('button[role="checkbox"]')
    expect(checkbox).toHaveAttribute('data-state', 'checked')
  })

  it('applies custom className', () => {
    const { container } = render(<Checkbox className="custom-checkbox" />)
    const checkbox = container.querySelector('button[role="checkbox"]')
    expect(checkbox).toHaveClass('custom-checkbox')
  })
})
