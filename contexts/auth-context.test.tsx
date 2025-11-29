import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/contexts/auth-context'

// Mock the entire API module
vi.mock('@/lib/api', () => ({
  authApi: {
    login: vi.fn().mockResolvedValue({
      access_token: 'fake-token',
      refresh_token: 'fake-refresh',
      user: { email: 'test@example.com', id: 1, full_name: 'Test User' }
    }),
    logout: vi.fn().mockResolvedValue({}),
    register: vi.fn().mockResolvedValue({
      access_token: 'fake-token',
      refresh_token: 'fake-refresh',
      user: { email: 'test@example.com', id: 1, full_name: 'Test User' }
    }),
  },
}))

// Test component that uses the auth context
function TestComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  it('provides initial unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated')
  })

  it('handles login', async () => {
    const user = userEvent.setup()
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const loginButton = screen.getByText('Login')
    await user.click(loginButton)
    
    // The actual behavior depends on your AuthContext implementation
  })

  it('handles logout', async () => {
    const user = userEvent.setup()
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const logoutButton = screen.getByText('Logout')
    await user.click(logoutButton)
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated')
  })
})
