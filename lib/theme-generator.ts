// Theme Generator - Creates intelligent color palettes from a primary color

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
}

export interface GeneratedTheme {
  name: string;
  light: ThemeColors;
  dark: ThemeColors;
}

// Convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Adjust lightness of a color
function adjustLightness(hex: string, amount: number): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, Math.min(100, l + amount)));
}

// Adjust saturation of a color
function adjustSaturation(hex: string, amount: number): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, Math.max(0, Math.min(100, s + amount)), l);
}

// Get a contrasting foreground color (black or white)
function getContrastingForeground(hex: string): string {
  const { l } = hexToHsl(hex);
  return l > 55 ? '#1a1a1a' : '#fafafa';
}

// Generate complementary color
function getComplementary(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex((h + 180) % 360, s, l);
}

// Generate analogous color
function getAnalogous(hex: string, offset: number = 30): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex((h + offset + 360) % 360, s, l);
}

// Generate a muted version
function getMuted(hex: string, lightMode: boolean): string {
  const { h, s } = hexToHsl(hex);
  return hslToHex(h, Math.max(5, s * 0.15), lightMode ? 96 : 18);
}

// Generate a theme from a primary color
export function generateTheme(primaryColor: string, themeName: string = 'Custom'): GeneratedTheme {
  const { h, s, l } = hexToHsl(primaryColor);
  
  // Light mode colors
  const lightPrimary = primaryColor;
  const lightSecondary = hslToHex(h, Math.max(8, s * 0.2), 96);
  const lightAccent = adjustLightness(adjustSaturation(primaryColor, -10), 15);
  const lightMuted = hslToHex(h, Math.max(5, s * 0.1), 96);
  const lightBackground = '#ffffff';
  const lightCard = '#ffffff';
  const lightBorder = hslToHex(h, Math.max(5, s * 0.1), 90);
  const lightSidebar = hslToHex(h, Math.max(3, s * 0.08), 98);
  const lightSidebarBorder = hslToHex(h, Math.max(5, s * 0.15), 90);

  // Dark mode colors
  const darkPrimary = adjustLightness(primaryColor, l < 50 ? 20 : 0);
  const darkBackground = hslToHex(h, Math.min(30, s * 0.5), 8);
  const darkCard = hslToHex(h, Math.min(25, s * 0.4), 12);
  const darkSecondary = darkCard;
  const darkAccent = hslToHex(h, Math.min(35, s * 0.5), 25);
  const darkMuted = hslToHex(h, Math.min(20, s * 0.3), 18);
  const darkBorder = darkMuted;
  const darkSidebar = darkCard;
  const darkSidebarBorder = darkMuted;

  return {
    name: themeName,
    light: {
      primary: lightPrimary,
      primaryForeground: getContrastingForeground(lightPrimary),
      secondary: lightSecondary,
      secondaryForeground: lightPrimary,
      accent: lightAccent,
      accentForeground: getContrastingForeground(lightAccent),
      background: lightBackground,
      foreground: '#1a1a1a',
      card: lightCard,
      cardForeground: '#1a1a1a',
      muted: lightMuted,
      mutedForeground: '#737373',
      border: lightBorder,
      ring: adjustLightness(primaryColor, 10),
      sidebar: lightSidebar,
      sidebarForeground: hslToHex(h, Math.min(60, s), 15),
      sidebarPrimary: lightPrimary,
      sidebarPrimaryForeground: getContrastingForeground(lightPrimary),
      sidebarAccent: lightSecondary,
      sidebarAccentForeground: lightPrimary,
      sidebarBorder: lightSidebarBorder,
    },
    dark: {
      primary: darkPrimary,
      primaryForeground: darkBackground,
      secondary: darkSecondary,
      secondaryForeground: '#fafafa',
      accent: darkAccent,
      accentForeground: '#fafafa',
      background: darkBackground,
      foreground: '#fafafa',
      card: darkCard,
      cardForeground: '#fafafa',
      muted: darkMuted,
      mutedForeground: '#a3a3a3',
      border: darkBorder,
      ring: darkPrimary,
      sidebar: darkSidebar,
      sidebarForeground: '#f5f5f5',
      sidebarPrimary: darkPrimary,
      sidebarPrimaryForeground: darkBackground,
      sidebarAccent: darkAccent,
      sidebarAccentForeground: '#f5f5f5',
      sidebarBorder: darkSidebarBorder,
    },
  };
}

// Apply theme to document
export function applyTheme(theme: GeneratedTheme, mode: 'light' | 'dark' | 'system'): void {
  const colors = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? theme.dark
    : theme.light;

  const root = document.documentElement;
  
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-foreground', colors.primaryForeground);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-secondary-foreground', colors.secondaryForeground);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-accent-foreground', colors.accentForeground);
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-foreground', colors.foreground);
  root.style.setProperty('--color-card', colors.card);
  root.style.setProperty('--color-card-foreground', colors.cardForeground);
  root.style.setProperty('--color-muted', colors.muted);
  root.style.setProperty('--color-muted-foreground', colors.mutedForeground);
  root.style.setProperty('--color-border', colors.border);
  root.style.setProperty('--color-ring', colors.ring);
  root.style.setProperty('--color-sidebar', colors.sidebar);
  root.style.setProperty('--color-sidebar-foreground', colors.sidebarForeground);
  root.style.setProperty('--color-sidebar-primary', colors.sidebarPrimary);
  root.style.setProperty('--color-sidebar-primary-foreground', colors.sidebarPrimaryForeground);
  root.style.setProperty('--color-sidebar-accent', colors.sidebarAccent);
  root.style.setProperty('--color-sidebar-accent-foreground', colors.sidebarAccentForeground);
  root.style.setProperty('--color-sidebar-border', colors.sidebarBorder);
}

// Preset themes
export const presetThemes: { name: string; primary: string }[] = [
  { name: 'Bakalr Brown', primary: '#8b4513' },
  { name: 'Ocean Blue', primary: '#2563eb' },
  { name: 'Forest Green', primary: '#16a34a' },
  { name: 'Royal Purple', primary: '#7c3aed' },
  { name: 'Sunset Orange', primary: '#ea580c' },
  { name: 'Rose Pink', primary: '#e11d48' },
  { name: 'Teal', primary: '#0d9488' },
  { name: 'Indigo', primary: '#4f46e5' },
  { name: 'Amber', primary: '#d97706' },
  { name: 'Slate', primary: '#475569' },
];

// Export CSS for the theme
export function exportThemeCSS(theme: GeneratedTheme): string {
  const lightVars = Object.entries(theme.light)
    .map(([key, value]) => `  --color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
    .join('\n');

  const darkVars = Object.entries(theme.dark)
    .map(([key, value]) => `  --color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
    .join('\n');

  return `/* ${theme.name} Theme */
:root {
${lightVars}
}

.dark {
${darkVars}
}`;
}
