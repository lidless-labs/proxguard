/**
 * ProxGuard — Main App Layout
 * Routes, header with variant selector, footer, and navigation shell.
 * Wrapped in ThemeProvider for variant-aware styling.
 */
import { Routes, Route, NavLink } from 'react-router-dom';
import { Shield, History, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuditPage } from './components/AuditPage';
import { HistoryPage } from './components/HistoryPage';
import { VariantSelector } from './components/VariantSelector';
import { ThemeProvider, useTheme } from './variants/ThemeProvider';

// ─── Inner Shell (needs theme context) ──────────────────────────────────────

function AppShell() {
  const theme = useTheme();

  return (
    <motion.div
      className={`min-h-screen ${theme.classes.bg} ${theme.classes.body} flex flex-col transition-colors duration-300`}
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* ─── Header ──────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 ${theme.classes.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Brand */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors`}
              style={{ background: `${theme.vars['--pg-accent']}22` }}
            >
              <Shield className={`w-5 h-5 ${theme.classes.accent}`} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className={`text-lg font-bold ${theme.classes.textPrimary} tracking-tight`}
                style={{ fontFamily: theme.fonts.heading }}
              >
                Prox<span className={theme.classes.accent}>Guard</span>
              </span>
              <span className={`text-[10px] ${theme.classes.textSecondary} uppercase tracking-widest -mt-0.5`}>
                Security Auditor
              </span>
            </div>
          </NavLink>

          {/* Center: Variant Selector */}
          <div className="hidden sm:flex">
            <VariantSelector />
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? theme.classes.navActive : theme.classes.navInactive
                }`
              }
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Audit</span>
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? theme.classes.navActive : theme.classes.navInactive
                }`
              }
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </NavLink>
          </nav>
        </div>

        {/* Mobile variant selector */}
        <div className="sm:hidden flex justify-center pb-2">
          <VariantSelector />
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────────────────── */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<AuditPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className={`${theme.classes.footer} py-4`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className={`flex items-center gap-2 text-xs ${theme.classes.textSecondary}`}>
            <Lock className={`w-3.5 h-3.5 ${theme.classes.accent} opacity-70`} />
            <span>100% client-side — your configs never leave your browser</span>
          </div>
          <div className={`text-xs ${theme.classes.textSecondary} opacity-60`}>
            ProxGuard v0.1.0 • {theme.name} theme
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

// ─── Root App (wraps ThemeProvider) ─────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
