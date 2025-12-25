import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateTheme,
  applyTheme,
  exportThemeCSS,
  presetThemes,
  GeneratedTheme,
  ThemeColors,
} from './theme-generator';

describe('theme-generator', () => {
  describe('generateTheme', () => {
    it('should generate a theme from a primary color', () => {
      const theme = generateTheme('#8b4513', 'Bakalr Brown');

      expect(theme.name).toBe('Bakalr Brown');
      expect(theme.light).toBeDefined();
      expect(theme.dark).toBeDefined();
    });

    it('should use default name when not provided', () => {
      const theme = generateTheme('#2563eb');

      expect(theme.name).toBe('Custom');
    });

    it('should generate all required color properties for light mode', () => {
      const theme = generateTheme('#16a34a', 'Forest Green');
      const expectedProperties: (keyof ThemeColors)[] = [
        'primary',
        'primaryForeground',
        'secondary',
        'secondaryForeground',
        'accent',
        'accentForeground',
        'background',
        'foreground',
        'card',
        'cardForeground',
        'muted',
        'mutedForeground',
        'border',
        'ring',
        'sidebar',
        'sidebarForeground',
        'sidebarPrimary',
        'sidebarPrimaryForeground',
        'sidebarAccent',
        'sidebarAccentForeground',
        'sidebarBorder',
      ];

      expectedProperties.forEach(prop => {
        expect(theme.light[prop]).toBeDefined();
        expect(theme.light[prop]).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should generate all required color properties for dark mode', () => {
      const theme = generateTheme('#7c3aed', 'Royal Purple');
      const expectedProperties: (keyof ThemeColors)[] = [
        'primary',
        'primaryForeground',
        'secondary',
        'secondaryForeground',
        'accent',
        'accentForeground',
        'background',
        'foreground',
        'card',
        'cardForeground',
        'muted',
        'mutedForeground',
        'border',
        'ring',
        'sidebar',
        'sidebarForeground',
        'sidebarPrimary',
        'sidebarPrimaryForeground',
        'sidebarAccent',
        'sidebarAccentForeground',
        'sidebarBorder',
      ];

      expectedProperties.forEach(prop => {
        expect(theme.dark[prop]).toBeDefined();
        expect(theme.dark[prop]).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should use the input color as primary in light mode', () => {
      const primaryColor = '#ea580c';
      const theme = generateTheme(primaryColor, 'Sunset Orange');

      expect(theme.light.primary).toBe(primaryColor);
    });

    it('should generate contrasting foreground colors', () => {
      // Dark primary color should have light foreground
      const darkTheme = generateTheme('#1a1a1a', 'Dark');
      expect(darkTheme.light.primaryForeground).toMatch(/^#[fF]/); // Light color

      // Light primary color should have dark foreground
      const lightTheme = generateTheme('#f0f0f0', 'Light');
      expect(lightTheme.light.primaryForeground).toMatch(/^#[0-3]/); // Dark color
    });

    it('should generate white background for light mode', () => {
      const theme = generateTheme('#4f46e5');

      expect(theme.light.background).toBe('#ffffff');
    });

    it('should generate dark background for dark mode', () => {
      const theme = generateTheme('#4f46e5');
      const { background } = theme.dark;

      // Dark mode background should be a very dark color (low lightness)
      expect(background).toMatch(/^#[0-2][0-9a-fA-F]{5}$/);
    });
  });

  describe('applyTheme', () => {
    let mockSetProperty: ReturnType<typeof vi.fn>;
    let originalDocument: typeof document;

    beforeEach(() => {
      mockSetProperty = vi.fn();
      originalDocument = global.document;
      global.document = {
        documentElement: {
          style: {
            setProperty: mockSetProperty,
          },
        },
      } as any;
    });

    afterEach(() => {
      global.document = originalDocument;
    });

    it('should apply light theme colors to document', () => {
      const theme = generateTheme('#2563eb', 'Ocean Blue');

      applyTheme(theme, 'light');

      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', theme.light.primary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', theme.light.background);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-foreground', theme.light.foreground);
    });

    it('should apply dark theme colors to document', () => {
      const theme = generateTheme('#2563eb', 'Ocean Blue');

      applyTheme(theme, 'dark');

      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', theme.dark.primary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', theme.dark.background);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-foreground', theme.dark.foreground);
    });

    it('should apply system theme based on prefers-color-scheme (dark)', () => {
      const originalWindow = global.window;
      global.window = {
        matchMedia: vi.fn().mockReturnValue({ matches: true }), // prefers dark
      } as any;

      const theme = generateTheme('#16a34a', 'Forest Green');
      applyTheme(theme, 'system');

      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', theme.dark.primary);

      global.window = originalWindow;
    });

    it('should apply system theme based on prefers-color-scheme (light)', () => {
      const originalWindow = global.window;
      global.window = {
        matchMedia: vi.fn().mockReturnValue({ matches: false }), // prefers light
      } as any;

      const theme = generateTheme('#16a34a', 'Forest Green');
      applyTheme(theme, 'system');

      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', theme.light.primary);

      global.window = originalWindow;
    });

    it('should set all CSS custom properties', () => {
      const theme = generateTheme('#d97706', 'Amber');

      applyTheme(theme, 'light');

      // Should set 21 color properties
      expect(mockSetProperty).toHaveBeenCalledTimes(21);
    });
  });

  describe('exportThemeCSS', () => {
    it('should generate valid CSS with theme name comment', () => {
      const theme = generateTheme('#475569', 'Slate');
      const css = exportThemeCSS(theme);

      expect(css).toContain('/* Slate Theme */');
    });

    it('should include :root selector for light mode', () => {
      const theme = generateTheme('#8b4513', 'Bakalr Brown');
      const css = exportThemeCSS(theme);

      expect(css).toContain(':root {');
    });

    it('should include .dark selector for dark mode', () => {
      const theme = generateTheme('#8b4513', 'Bakalr Brown');
      const css = exportThemeCSS(theme);

      expect(css).toContain('.dark {');
    });

    it('should convert camelCase to kebab-case for CSS properties', () => {
      const theme = generateTheme('#2563eb', 'Ocean Blue');
      const css = exportThemeCSS(theme);

      expect(css).toContain('--color-primary:');
      expect(css).toContain('--color-primary-foreground:');
      expect(css).toContain('--color-secondary-foreground:');
      expect(css).toContain('--color-sidebar-primary-foreground:');
    });

    it('should include all color variables', () => {
      const theme = generateTheme('#7c3aed', 'Royal Purple');
      const css = exportThemeCSS(theme);

      expect(css).toContain('--color-primary:');
      expect(css).toContain('--color-background:');
      expect(css).toContain('--color-foreground:');
      expect(css).toContain('--color-muted:');
      expect(css).toContain('--color-border:');
      expect(css).toContain('--color-sidebar:');
    });

    it('should generate valid hex colors in CSS', () => {
      const theme = generateTheme('#ea580c', 'Sunset Orange');
      const css = exportThemeCSS(theme);

      // All color values should be valid hex
      const hexPattern = /#[0-9a-fA-F]{6}/g;
      const matches = css.match(hexPattern);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(0);
    });
  });

  describe('presetThemes', () => {
    it('should have preset themes defined', () => {
      expect(presetThemes).toBeDefined();
      expect(Array.isArray(presetThemes)).toBe(true);
      expect(presetThemes.length).toBeGreaterThan(0);
    });

    it('should include Bakalr Brown theme', () => {
      const bakalrBrown = presetThemes.find(t => t.name === 'Bakalr Brown');
      expect(bakalrBrown).toBeDefined();
      expect(bakalrBrown?.primary).toBe('#8b4513');
    });

    it('should have valid hex colors for all presets', () => {
      presetThemes.forEach(preset => {
        expect(preset.name).toBeDefined();
        expect(preset.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should be able to generate themes from all presets', () => {
      presetThemes.forEach(preset => {
        const theme = generateTheme(preset.primary, preset.name);
        expect(theme.name).toBe(preset.name);
        expect(theme.light.primary).toBe(preset.primary);
      });
    });

    it('should include common color themes', () => {
      const themeNames = presetThemes.map(t => t.name);
      expect(themeNames).toContain('Ocean Blue');
      expect(themeNames).toContain('Forest Green');
      expect(themeNames).toContain('Royal Purple');
    });
  });

  describe('color conversion accuracy', () => {
    it('should preserve color hue when generating theme', () => {
      const theme = generateTheme('#ff0000', 'Pure Red'); // Pure red
      // Primary should be red-ish
      expect(theme.light.primary).toBe('#ff0000');
    });

    it('should handle edge case colors', () => {
      // Pure white
      expect(() => generateTheme('#ffffff', 'White')).not.toThrow();
      
      // Pure black
      expect(() => generateTheme('#000000', 'Black')).not.toThrow();
      
      // Gray (no saturation)
      expect(() => generateTheme('#808080', 'Gray')).not.toThrow();
    });

    it('should generate accessible contrast ratios', () => {
      const theme = generateTheme('#2563eb', 'Blue');
      
      // Light background should be light
      const lightBg = theme.light.background;
      expect(lightBg).toBe('#ffffff');
      
      // Dark foreground should be dark
      const darkFg = theme.light.foreground;
      expect(darkFg).toMatch(/^#[0-3]/);
    });
  });
});
