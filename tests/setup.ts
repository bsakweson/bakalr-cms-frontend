import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock ResizeObserver (used by cmdk library)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock window.matchMedia (used by theme detection)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock scrollIntoView (used by cmdk library)
Element.prototype.scrollIntoView = vi.fn()

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock auth context (default authenticated user)
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@example.com',
      full_name: 'Test User',
      first_name: 'Test',
      last_name: 'User',
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock preferences context
vi.mock('@/contexts/preferences-context', () => ({
  usePreferences: () => ({
    preferences: {
      theme: 'system',
      language: 'en',
      pageSize: 10,
      sidebarCollapsed: false,
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
    },
    setPreferences: vi.fn(),
    updatePreference: vi.fn(),
    resetPreferences: vi.fn(),
  }),
  PreferencesProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api/v1'
