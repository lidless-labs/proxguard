/**
 * ProxGuard — Theme System
 * Two-theme system: Light (former Warm Minimal) and Dark.
 * Components read from the active theme via ThemeProvider context.
 */

// ─── Theme Interface ────────────────────────────────────────────────────────

export interface VariantTheme {
  id: number;
  name: string;
  /** CSS custom properties applied to document root */
  vars: Record<string, string>;
  /** Tailwind-compatible class overrides for layout elements */
  classes: {
    bg: string;
    body: string;
    card: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    input: string;
    button: string;
    buttonDisabled: string;
    header: string;
    footer: string;
    tabActive: string;
    tabInactive: string;
    navActive: string;
    navInactive: string;
    selection: string;
    indicator: string;
    scrollThumb: string;
    scrollThumbHover: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  chartColors: {
    primary: string;
    secondary: string;
    grid: string;
    text: string;
    fill: string;
  };
  /** Gauge-specific overrides */
  gauge: {
    track: string;
    /** Custom color override — if null, use default scoreToColor */
    colorOverride: string | null;
    glow: boolean;
  };
}

export const lightTheme: VariantTheme = {
  id: 1,
  name: 'Light',
  vars: {
    '--pg-bg': '#fafaf9',
    '--pg-card': '#ffffff',
    '--pg-accent': '#d97706',
    '--pg-accent-dim': 'rgba(217,119,6,0.1)',
    '--pg-text': '#292524',
    '--pg-text-dim': '#78716c',
    '--pg-border': '#e7e5e4',
  },
  classes: {
    bg: 'bg-[#fafaf9]',
    body: 'text-[#292524]',
    card: 'bg-white shadow-sm',
    cardBorder: 'border-[#e7e5e4]',
    textPrimary: 'text-[#292524]',
    textSecondary: 'text-[#78716c]',
    accent: 'text-[#d97706]',
    input: 'bg-white border-[#d6d3d1] text-[#292524] placeholder-[#a8a29e] focus:ring-[#d97706]/30 focus:border-[#d97706]/50',
    button: 'bg-[#d97706] hover:bg-[#b45309] text-white shadow-sm',
    buttonDisabled: 'bg-[#e7e5e4] text-[#a8a29e] cursor-not-allowed',
    header: 'bg-[#fafaf9]/95 backdrop-blur-md border-b border-[#e7e5e4]',
    footer: 'border-t border-[#e7e5e4]',
    tabActive: 'bg-[#d97706]/10 text-[#d97706] font-semibold',
    tabInactive: 'text-[#78716c] hover:text-[#d97706] hover:bg-[#f5f5f4]',
    navActive: 'bg-[#d97706]/10 text-[#d97706]',
    navInactive: 'text-[#78716c] hover:text-[#d97706] hover:bg-[#f5f5f4]',
    selection: 'selection:bg-[#d97706]/20',
    indicator: 'bg-[#d97706]',
    scrollThumb: '#d6d3d1',
    scrollThumbHover: '#a8a29e',
  },
  fonts: {
    heading: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  chartColors: {
    primary: '#d97706',
    secondary: '#c2410c',
    grid: '#e7e5e4',
    text: '#78716c',
    fill: '#d97706',
  },
  gauge: {
    track: '#e7e5e4',
    colorOverride: null,
    glow: false,
  },
};

export const darkTheme: VariantTheme = {
  id: 2,
  name: 'Dark',
  vars: {
    '--pg-bg': '#1a1a1a',
    '--pg-card': '#242424',
    '--pg-accent': '#d97706',
    '--pg-accent-dim': 'rgba(217,119,6,0.12)',
    '--pg-text': '#e5e5e5',
    '--pg-text-dim': '#8b8b8b',
    '--pg-border': '#333333',
  },
  classes: {
    bg: 'bg-[#1a1a1a]',
    body: 'text-[#e5e5e5]',
    card: 'bg-[#242424]',
    cardBorder: 'border-[#333333]',
    textPrimary: 'text-[#e5e5e5]',
    textSecondary: 'text-[#8b8b8b]',
    accent: 'text-[#d97706]',
    input: 'bg-[#1e1e1e] border-[#3a3a3a] text-[#e5e5e5] placeholder-[#666666] focus:ring-[#d97706]/30 focus:border-[#d97706]/50',
    button: 'bg-[#d97706] hover:bg-[#b45309] text-white',
    buttonDisabled: 'bg-[#2a2a2a] text-[#555555] cursor-not-allowed',
    header: 'bg-[#1a1a1a]/95 backdrop-blur-md border-b border-[#333333]',
    footer: 'border-t border-[#333333]',
    tabActive: 'bg-[#d97706]/15 text-[#d97706]',
    tabInactive: 'text-[#8b8b8b] hover:text-[#d97706] hover:bg-[#2a2a2a]',
    navActive: 'bg-[#d97706]/15 text-[#d97706]',
    navInactive: 'text-[#8b8b8b] hover:text-[#d97706] hover:bg-[#2a2a2a]',
    selection: 'selection:bg-[#d97706]/25',
    indicator: 'bg-[#d97706]',
    scrollThumb: '#3a3a3a',
    scrollThumbHover: '#555555',
  },
  fonts: {
    heading: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  chartColors: {
    primary: '#d97706',
    secondary: '#b45309',
    grid: '#333333',
    text: '#8b8b8b',
    fill: '#d97706',
  },
  gauge: {
    track: '#333333',
    colorOverride: null,
    glow: false,
  },
};

export const themes: Record<number, VariantTheme> = { 1: lightTheme, 2: darkTheme };

export function getTheme(variant: number): VariantTheme {
  return themes[variant] ?? themes[1];
}

export const themeList: VariantTheme[] = [lightTheme, darkTheme];
