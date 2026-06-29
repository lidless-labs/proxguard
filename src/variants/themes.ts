/**
 * ProxGuard — Theme
 * Single theme: Analyst (clean white background, blue accents — professional audit).
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

export const analystTheme: VariantTheme = {
  id: 1,
  name: 'Analyst',
  vars: {
    '--pg-bg': '#f8fafc',
    '--pg-card': '#ffffff',
    '--pg-accent': '#2563eb',
    '--pg-accent-dim': 'rgba(37,99,235,0.1)',
    '--pg-text': '#1e293b',
    '--pg-text-dim': '#64748b',
    '--pg-border': '#e2e8f0',
  },
  classes: {
    bg: 'bg-[#f8fafc]',
    body: 'text-[#1e293b]',
    card: 'bg-white shadow-sm',
    cardBorder: 'border-[#e2e8f0]',
    textPrimary: 'text-[#1e293b]',
    textSecondary: 'text-[#64748b]',
    accent: 'text-[#2563eb]',
    input: 'bg-white border-[#cbd5e1] text-[#1e293b] placeholder-[#94a3b8] focus:ring-[#2563eb]/30 focus:border-[#2563eb]/50',
    button: 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-sm',
    buttonDisabled: 'bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed',
    header: 'bg-[#f8fafc]/95 backdrop-blur-md border-b border-[#e2e8f0]',
    footer: 'border-t border-[#e2e8f0]',
    tabActive: 'bg-[#2563eb]/10 text-[#2563eb] font-semibold',
    tabInactive: 'text-[#64748b] hover:text-[#2563eb] hover:bg-[#f1f5f9]',
    navActive: 'bg-[#2563eb]/10 text-[#2563eb]',
    navInactive: 'text-[#64748b] hover:text-[#2563eb] hover:bg-[#f1f5f9]',
    selection: 'selection:bg-[#2563eb]/20',
    indicator: 'bg-[#2563eb]',
    scrollThumb: '#cbd5e1',
    scrollThumbHover: '#94a3b8',
  },
  fonts: {
    heading: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  chartColors: {
    primary: '#2563eb',
    secondary: '#1d4ed8',
    grid: '#e2e8f0',
    text: '#64748b',
    fill: '#2563eb',
  },
  gauge: {
    track: '#e2e8f0',
    colorOverride: null,
    glow: false,
  },
};

/** The single active theme. */
export const theme: VariantTheme = analystTheme;
