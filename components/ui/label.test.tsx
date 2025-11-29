import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Label } from './label'

describe('Label Component', () => {
  it('renders label with text', () => {
    render(<Label>Test Label</Label>)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('associates with input via htmlFor', () => {
    render(
      <>
        <Label htmlFor="test-input">Label</Label>
        <input id="test-input" />
      </>
    )
    
    const label = screen.getByText('Label')
    expect(label).toHaveAttribute('for', 'test-input')
  })

  it('applies custom className', () => {
    render(<Label className="custom-label">Custom</Label>)
    const label = screen.getByText('Custom')
    expect(label).toHaveClass('custom-label')
  })
})
