/**
 * ProxGuard — Theme System
 * Five visual variants, each with full class and color overrides.
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

// ─── Variant 1: SOC Terminal ────────────────────────────────────────────────
// Dark (#0a0a0f) background, green-on-black terminal aesthetic.
// JetBrains Mono everywhere. Neon green gauge. Faux terminal glow.

const socTerminal: VariantTheme = {
  id: 1,
  name: 'SOC Terminal',
  vars: {
    '--pg-bg': '#0a0a0f',
    '--pg-card': '#0d0d14',
    '--pg-accent': '#00ff41',
    '--pg-accent-dim': 'rgba(0,255,65,0.15)',
    '--pg-text': '#00ff41',
    '--pg-text-dim': '#0a7a25',
    '--pg-border': '#1a2a1a',
  },
  classes: {
    bg: 'bg-[#0a0a0f]',
    body: 'text-[#00ff41]',
    card: 'bg-[#0d0d14] shadow-[0_0_20px_rgba(0,255,65,0.08)]',
    cardBorder: 'border-[#1a2a1a]',
    textPrimary: 'text-[#00ff41]',
    textSecondary: 'text-[#0a7a25]',
    accent: 'text-[#00ff41]',
    input: 'bg-[#060609] border-[#1a2a1a] text-[#00ff41] placeholder-[#0a5a1a] focus:ring-[#00ff41]/30 focus:border-[#00ff41]/40',
    button: 'bg-[#00ff41]/20 hover:bg-[#00ff41]/30 text-[#00ff41] border border-[#00ff41]/40 shadow-[0_0_15px_rgba(0,255,65,0.2)]',
    buttonDisabled: 'bg-[#0d0d14] text-[#1a3a1a] border border-[#1a2a1a] cursor-not-allowed',
    header: 'bg-[#0a0a0f]/90 backdrop-blur-md border-b border-[#1a2a1a]',
    footer: 'border-t border-[#1a2a1a]',
    tabActive: 'bg-[#1a2a1a] text-[#00ff41]',
    tabInactive: 'text-[#0a7a25] hover:text-[#00ff41] hover:bg-[#1a2a1a]/50',
    navActive: 'bg-[#1a2a1a] text-[#00ff41]',
    navInactive: 'text-[#0a7a25] hover:text-[#00ff41] hover:bg-[#1a2a1a]/50',
    selection: 'selection:bg-[#00ff41]/30',
    indicator: 'bg-[#00ff41]',
    scrollThumb: '#1a3a1a',
    scrollThumbHover: '#00ff41',
  },
  fonts: {
    heading: "'JetBrains Mono', monospace",
    body: "'JetBrains Mono', monospace",
    mono: "'JetBrains Mono', monospace",
  },
  chartColors: {
    primary: '#00ff41',
    secondary: '#00cc33',
    grid: '#1a2a1a',
    text: '#0a7a25',
    fill: '#00ff41',
  },
  gauge: {
    track: '#1a2a1a',
    colorOverride: '#00ff41',
    glow: true,
  },
};

// ─── Variant 2: Compliance Dashboard ────────────────────────────────────────
// Clean corporate. White/light gray background, navy (#1a237e) accent.
// Card shadows, enterprise compliance software look.

const complianceDashboard: VariantTheme = {
  id: 2,
  name: 'Compliance Dashboard',
  vars: {
    '--pg-bg': '#f8f9fa',
    '--pg-card': '#ffffff',
    '--pg-accent': '#1a237e',
    '--pg-accent-dim': 'rgba(26,35,126,0.1)',
    '--pg-text': '#1a1a2e',
    '--pg-text-dim': '#6b7280',
    '--pg-border': '#e5e7eb',
  },
  classes: {
    bg: 'bg-[#f8f9fa]',
    body: 'text-[#1a1a2e]',
    card: 'bg-white shadow-md',
    cardBorder: 'border-[#e5e7eb]',
    textPrimary: 'text-[#1a1a2e]',
    textSecondary: 'text-[#6b7280]',
    accent: 'text-[#1a237e]',
    input: 'bg-white border-[#d1d5db] text-[#1a1a2e] placeholder-[#9ca3af] focus:ring-[#1a237e]/30 focus:border-[#1a237e]/50',
    button: 'bg-[#1a237e] hover:bg-[#283593] text-white shadow-md',
    buttonDisabled: 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed',
    header: 'bg-white/95 backdrop-blur-md border-b border-[#e5e7eb] shadow-sm',
    footer: 'border-t border-[#e5e7eb]',
    tabActive: 'bg-[#1a237e]/10 text-[#1a237e] font-semibold',
    tabInactive: 'text-[#6b7280] hover:text-[#1a237e] hover:bg-[#f3f4f6]',
    navActive: 'bg-[#1a237e]/10 text-[#1a237e]',
    navInactive: 'text-[#6b7280] hover:text-[#1a237e] hover:bg-[#f3f4f6]',
    selection: 'selection:bg-[#1a237e]/20',
    indicator: 'bg-[#1a237e]',
    scrollThumb: '#d1d5db',
    scrollThumbHover: '#9ca3af',
  },
  fonts: {
    heading: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  chartColors: {
    primary: '#1a237e',
    secondary: '#3f51b5',
    grid: '#e5e7eb',
    text: '#6b7280',
    fill: '#1a237e',
  },
  gauge: {
    track: '#e5e7eb',
    colorOverride: null,
    glow: false,
  },
};

// ─── Variant 3: Hacker Aesthetic ────────────────────────────────────────────
// Black with red (#ff1744) and amber (#ff9100). Monospace everything.
// Matrix/glitch vibe. Vulnerability report styling.

const hackerAesthetic: VariantTheme = {
  id: 3,
  name: 'Hacker Aesthetic',
  vars: {
    '--pg-bg': '#0a0a0a',
    '--pg-card': '#111111',
    '--pg-accent': '#ff1744',
    '--pg-accent-dim': 'rgba(255,23,68,0.15)',
    '--pg-text': '#e0e0e0',
    '--pg-text-dim': '#666666',
    '--pg-border': '#2a1a1a',
  },
  classes: {
    bg: 'bg-[#0a0a0a]',
    body: 'text-[#e0e0e0]',
    card: 'bg-[#111111] shadow-[0_0_15px_rgba(255,23,68,0.06)]',
    cardBorder: 'border-[#2a1a1a]',
    textPrimary: 'text-[#e0e0e0]',
    textSecondary: 'text-[#666666]',
    accent: 'text-[#ff1744]',
    input: 'bg-[#0a0a0a] border-[#2a1a1a] text-[#ff9100] placeholder-[#4a3020] focus:ring-[#ff1744]/30 focus:border-[#ff1744]/40 font-mono',
    button: 'bg-[#ff1744]/20 hover:bg-[#ff1744]/30 text-[#ff1744] border border-[#ff1744]/40 shadow-[0_0_15px_rgba(255,23,68,0.15)]',
    buttonDisabled: 'bg-[#111111] text-[#333333] border border-[#2a1a1a] cursor-not-allowed',
    header: 'bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#2a1a1a]',
    footer: 'border-t border-[#2a1a1a]',
    tabActive: 'bg-[#2a1a1a] text-[#ff1744]',
    tabInactive: 'text-[#666666] hover:text-[#ff9100] hover:bg-[#1a1111]/50',
    navActive: 'bg-[#2a1a1a] text-[#ff1744]',
    navInactive: 'text-[#666666] hover:text-[#ff1744] hover:bg-[#2a1a1a]/50',
    selection: 'selection:bg-[#ff1744]/30',
    indicator: 'bg-[#ff1744]',
    scrollThumb: '#2a1a1a',
    scrollThumbHover: '#ff1744',
  },
  fonts: {
    heading: "'JetBrains Mono', 'Fira Code', monospace",
    body: "'JetBrains Mono', 'Fira Code', monospace",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  chartColors: {
    primary: '#ff1744',
    secondary: '#ff9100',
    grid: '#2a1a1a',
    text: '#666666',
    fill: '#ff1744',
  },
  gauge: {
    track: '#2a1a1a',
    colorOverride: '#ff1744',
    glow: true,
  },
};

// ─── Variant 4: Blueprint ──────────────────────────────────────────────────
// Steel blue (#37474f) and white. Technical drawing grid, dashed borders.
// Schematic feel with crosshatch patterns.

const blueprint: VariantTheme = {
  id: 4,
  name: 'Blueprint',
  vars: {
    '--pg-bg': '#263238',
    '--pg-card': '#37474f',
    '--pg-accent': '#b0bec5',
    '--pg-accent-dim': 'rgba(176,190,197,0.15)',
    '--pg-text': '#eceff1',
    '--pg-text-dim': '#78909c',
    '--pg-border': '#546e7a',
  },
  classes: {
    bg: 'bg-[#263238]',
    body: 'text-[#eceff1]',
    card: 'bg-[#37474f]',
    cardBorder: 'border-dashed border-[#546e7a]',
    textPrimary: 'text-[#eceff1]',
    textSecondary: 'text-[#78909c]',
    accent: 'text-[#b0bec5]',
    input: 'bg-[#263238] border-dashed border-[#546e7a] text-[#eceff1] placeholder-[#546e7a] focus:ring-[#b0bec5]/30 focus:border-[#b0bec5]/50',
    button: 'bg-[#546e7a] hover:bg-[#607d8b] text-[#eceff1] border border-dashed border-[#78909c]',
    buttonDisabled: 'bg-[#37474f] text-[#546e7a] border border-dashed border-[#455a64] cursor-not-allowed',
    header: 'bg-[#263238]/95 backdrop-blur-md border-b border-dashed border-[#546e7a]',
    footer: 'border-t border-dashed border-[#546e7a]',
    tabActive: 'bg-[#455a64] text-[#eceff1] border-b-2 border-[#b0bec5]',
    tabInactive: 'text-[#78909c] hover:text-[#eceff1] hover:bg-[#455a64]/50',
    navActive: 'bg-[#455a64] text-[#eceff1]',
    navInactive: 'text-[#78909c] hover:text-[#eceff1] hover:bg-[#455a64]/50',
    selection: 'selection:bg-[#b0bec5]/30',
    indicator: 'bg-[#b0bec5]',
    scrollThumb: '#546e7a',
    scrollThumbHover: '#78909c',
  },
  fonts: {
    heading: "'JetBrains Mono', monospace",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  chartColors: {
    primary: '#b0bec5',
    secondary: '#78909c',
    grid: '#455a64',
    text: '#78909c',
    fill: '#b0bec5',
  },
  gauge: {
    track: '#455a64',
    colorOverride: '#b0bec5',
    glow: false,
  },
};

// ─── Variant 5: Warm Minimal ───────────────────────────────────────────────
// Off-white (#fafaf9), warm accents (amber, terracotta). Large Inter typography.
// Generous whitespace. Clean cards. Mobile-first. Approachable.

const warmMinimal: VariantTheme = {
  id: 5,
  name: 'Warm Minimal',
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

// ─── Theme Registry ─────────────────────────────────────────────────────────

export const themes: Record<number, VariantTheme> = {
  1: socTerminal,
  2: complianceDashboard,
  3: hackerAesthetic,
  4: blueprint,
  5: warmMinimal,
};

/** Get theme by variant number (defaults to variant 1) */
export function getTheme(variant: number): VariantTheme {
  return themes[variant] ?? themes[1];
}

/** All theme entries for selector display */
export const themeList: VariantTheme[] = [
  socTerminal,
  complianceDashboard,
  hackerAesthetic,
  blueprint,
  warmMinimal,
];
