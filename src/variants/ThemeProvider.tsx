/**
 * ThemeProvider — React context that provides the active theme to all children.
 * Reads activeVariant from Zustand, applies CSS custom properties to document root,
 * and exposes a useTheme() hook for component-level access.
 */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useAuditStore } from '../store/auditStore';
import { getTheme, type VariantTheme } from './themes';

// ─── Context ────────────────────────────────────────────────────────────────

const ThemeContext = createContext<VariantTheme | null>(null);

/**
 * Hook to access the current variant theme.
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
  const activeVariant = useAuditStore((s) => s.activeVariant);
  const theme = useMemo(() => getTheme(activeVariant), [activeVariant]);

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
      ::selection { background: var(--pg-accent-dim, rgba(16,185,129,0.3)); color: var(--pg-text, #fff); }
    `;

    // Cleanup: remove custom properties on unmount
    return () => {
      for (const key of Object.keys(theme.vars)) {
        root.style.removeProperty(key);
      }
      root.style.removeProperty('--pg-font-heading');
      root.style.removeProperty('--pg-font-body');
      root.style.removeProperty('--pg-font-mono');
      root.style.fontFamily = '';
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}
