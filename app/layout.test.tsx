import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RootLayout, { metadata } from './layout';

// Mock Next.js font imports
vi.mock('next/font/google', () => ({
  Geist: vi.fn(() => ({
    variable: '--font-geist-sans',
  })),
  Geist_Mono: vi.fn(() => ({
    variable: '--font-geist-mono',
  })),
}));

// Mock AuthProvider
vi.mock('@/contexts/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

describe('RootLayout', () => {
  describe('Metadata', () => {
    it('should have correct title', () => {
      expect(metadata.title).toBe('Bakalr CMS - Headless Content Management System');
    });

    it('should have correct description', () => {
      expect(metadata.description).toBe(
        'Modern headless CMS with multi-language support and dark chocolate brown theme'
      );
    });

    it('should have favicon icon', () => {
      expect(metadata.icons).toHaveProperty('icon', '/favicon.ico');
    });

    it('should have apple icon', () => {
      expect(metadata.icons).toHaveProperty('apple', '/bakalr-icon.svg');
    });
  });

  describe('Layout Structure', () => {

    it('should wrap children in AuthProvider', () => {
      render(
        <RootLayout>
          <div data-testid="child-content">Test Content</div>
        </RootLayout>
      );
      
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('should render children inside AuthProvider', () => {
      const testContent = 'Test child content';
      render(
        <RootLayout>
          <div>{testContent}</div>
        </RootLayout>
      );
      
      const authProvider = screen.getByTestId('auth-provider');
      expect(authProvider).toHaveTextContent(testContent);
    });
  });

  describe('Children Rendering', () => {
    it('should render single child component', () => {
      render(
        <RootLayout>
          <div data-testid="single-child">Single Child</div>
        </RootLayout>
      );
      
      expect(screen.getByTestId('single-child')).toBeInTheDocument();
    });

    it('should render multiple child components', () => {
      render(
        <RootLayout>
          <>
            <div data-testid="child-1">Child 1</div>
            <div data-testid="child-2">Child 2</div>
          </>
        </RootLayout>
      );
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should render complex nested children', () => {
      render(
        <RootLayout>
          <div>
            <header data-testid="header">Header</header>
            <main data-testid="main">
              <article>Content</article>
            </main>
            <footer data-testid="footer">Footer</footer>
          </div>
        </RootLayout>
      );
      
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('main')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('HTML Structure', () => {
    it('should have correct element hierarchy (AuthProvider > children)', () => {
      render(
        <RootLayout>
          <div data-testid="content">Content</div>
        </RootLayout>
      );
      
      const authProvider = screen.getByTestId('auth-provider');
      const content = screen.getByTestId('content');
      
      expect(authProvider).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      
      // Content should be inside AuthProvider
      expect(authProvider).toContainElement(content);
    });

    it('should not have any additional unexpected elements', () => {
      const { container } = render(
        <RootLayout>
          <div data-testid="only-child">Only Child</div>
        </RootLayout>
      );
      
      const authProvider = screen.getByTestId('auth-provider');
      // AuthProvider should only contain the child, nothing else
      expect(authProvider.children).toHaveLength(1);
    });
  });
});
