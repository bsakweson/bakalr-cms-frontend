import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from './textarea'

describe('Textarea Component', () => {
  it('renders textarea', () => {
    render(<Textarea placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('accepts user input', async () => {
    const user = userEvent.setup()
    render(<Textarea placeholder="Type here" />)
    
    const textarea = screen.getByPlaceholderText('Type here')
    await user.type(textarea, 'Hello World')
    
    expect(textarea).toHaveValue('Hello World')
  })

  it('can be disabled', () => {
    render(<Textarea disabled placeholder="Disabled" />)
    const textarea = screen.getByPlaceholderText('Disabled')
    expect(textarea).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Textarea className="custom-textarea" placeholder="Custom" />)
    const textarea = screen.getByPlaceholderText('Custom')
    expect(textarea).toHaveClass('custom-textarea')
  })

  it('supports rows attribute', () => {
    render(<Textarea rows={5} placeholder="Rows" />)
    const textarea = screen.getByPlaceholderText('Rows')
    expect(textarea).toHaveAttribute('rows', '5')
  })
})
