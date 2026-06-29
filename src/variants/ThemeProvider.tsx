/**
 * ThemeProvider — React context that provides the active theme to all children.
 * Applies the single Analyst theme's CSS custom properties to the document root
 * and exposes a useTheme() hook for component-level access.
 */
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { theme, type VariantTheme } from './themes';

// ─── Context ────────────────────────────────────────────────────────────────

const ThemeContext = createContext<VariantTheme | null>(null);

/**
 * Hook to access the current theme.
 * Must be used within a <ThemeProvider>.
 */
export function useTheme(): VariantTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() must be used within a <ThemeProvider>');
  }
  return ctx;
}

// ─── Provider Component ─────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Apply CSS custom properties + font families to document root
  useEffect(() => {
    const root = document.documentElement;

    // Set CSS custom properties from theme.vars
    for (const [key, value] of Object.entries(theme.vars)) {
      root.style.setProperty(key, value);
    }

    // Set font families
    root.style.setProperty('--pg-font-heading', theme.fonts.heading);
    root.style.setProperty('--pg-font-body', theme.fonts.body);
    root.style.setProperty('--pg-font-mono', theme.fonts.mono);

    // Apply body font to root
    root.style.fontFamily = theme.fonts.body;

    // Update scrollbar colors via a dynamic style element
    let styleEl = document.getElementById('pg-theme-scrollbar');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'pg-theme-scrollbar';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      * { scrollbar-color: ${theme.classes.scrollThumb} transparent; }
      *::-webkit-scrollbar-thumb { background: ${theme.classes.scrollThumb}; }
      *::-webkit-scrollbar-thumb:hover { background: ${theme.classes.scrollThumbHover}; }
      ::selection { background: var(--pg-accent-dim, rgba(37,99,235,0.2)); color: var(--pg-text, #1e293b); }
    `;
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}
