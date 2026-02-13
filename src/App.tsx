/**
 * ProxGuard — Main App Layout
 * Routes, header with variant selector, footer, and navigation shell.
 * Wrapped in ThemeProvider for variant-aware styling.
 */
import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { Shield, History, Lock, X, FileText, Server, AlertTriangle, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuditPage } from './components/AuditPage';
import { HistoryPage } from './components/HistoryPage';
import { VariantSelector } from './components/VariantSelector';
import { ThemeProvider, useTheme } from './variants/ThemeProvider';
import { allRules } from './rules';

// ─── Explainability Modal ───────────────────────────────────────────────────

const checkedFiles = [
  'sshd_config',
  'user.cfg',
  'cluster.fw',
  'iptables',
  'lxc.conf',
  'storage.cfg',
] as const;

type TransparencyModalProps = {
  open: boolean;
  onClose: () => void;
};

function TransparencyModal({ open, onClose }: TransparencyModalProps) {
  const theme = useTheme();

  const ruleSummary = useMemo(() => {
    const byCategory = new Map<string, number>();
    const bySeverity = new Map<string, number>();

    for (const rule of allRules) {
      byCategory.set(rule.category, (byCategory.get(rule.category) ?? 0) + 1);
      bySeverity.set(rule.severity, (bySeverity.get(rule.severity) ?? 0) + 1);
    }

    return {
      byCategory,
      bySeverity,
      total: allRules.length,
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transparency-title"
            className={`w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border ${theme.classes.card} ${theme.classes.cardBorder}`}
            style={{ fontFamily: theme.fonts.body }}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b backdrop-blur-sm"
              style={{ borderColor: 'var(--pg-border)', backgroundColor: 'color-mix(in oklab, var(--pg-card) 92%, transparent)' }}
            >
              <h2 id="transparency-title" className={`text-lg font-semibold ${theme.classes.textPrimary}`} style={{ fontFamily: theme.fonts.heading }}>
                How ProxGuard Works
              </h2>
              <button
                onClick={onClose}
                className={`inline-flex items-center justify-center rounded-md p-1.5 ${theme.classes.navInactive}`}
                aria-label="Close explainability dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Server className={`w-4 h-4 ${theme.classes.accent}`} />
                  <h3 className={`text-sm font-semibold uppercase tracking-wide ${theme.classes.textPrimary}`}>Methodology</h3>
                </div>
                <p className={`text-sm leading-relaxed ${theme.classes.textSecondary}`}>
                  ProxGuard parses your pasted Proxmox configuration files directly in your browser, then runs a local rules engine against the parsed data.
                  No backend processing is required for analysis.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className={`w-4 h-4 ${theme.classes.accent}`} />
                  <h3 className={`text-sm font-semibold uppercase tracking-wide ${theme.classes.textPrimary}`}>Data Sources (Files Checked)</h3>
                </div>
                <ul className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm ${theme.classes.textSecondary}`}>
                  {checkedFiles.map(file => (
                    <li key={file} className={`px-3 py-2 rounded-md border ${theme.classes.cardBorder}`} style={{ background: 'var(--pg-accent-dim)' }}>
                      {file}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-4 h-4 ${theme.classes.accent}`} />
                  <h3 className={`text-sm font-semibold uppercase tracking-wide ${theme.classes.textPrimary}`}>Rule Coverage</h3>
                </div>
                <p className={`text-sm ${theme.classes.textSecondary} mb-3`}>
                  The current ruleset contains <span className={theme.classes.textPrimary}>{ruleSummary.total}</span> checks across SSH, authentication, firewall, container, storage, and API security.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`rounded-lg border p-3 ${theme.classes.cardBorder}`}>
                    <p className={`text-xs mb-2 uppercase tracking-wide ${theme.classes.textSecondary}`}>By Category</p>
                    <ul className={`space-y-1 text-sm ${theme.classes.textSecondary}`}>
                      {[...ruleSummary.byCategory.entries()].map(([category, count]) => (
                        <li key={category} className="flex items-center justify-between">
                          <span className="capitalize">{category}</span>
                          <span className={theme.classes.textPrimary}>{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`rounded-lg border p-3 ${theme.classes.cardBorder}`}>
                    <p className={`text-xs mb-2 uppercase tracking-wide ${theme.classes.textSecondary}`}>By Severity</p>
                    <ul className={`space-y-1 text-sm ${theme.classes.textSecondary}`}>
                      {[...ruleSummary.bySeverity.entries()].map(([severity, count]) => (
                        <li key={severity} className="flex items-center justify-between">
                          <span className="capitalize">{severity}</span>
                          <span className={theme.classes.textPrimary}>{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className={`w-4 h-4 ${theme.classes.accent}`} />
                  <h3 className={`text-sm font-semibold uppercase tracking-wide ${theme.classes.textPrimary}`}>Scoring Model</h3>
                </div>
                <p className={`text-sm leading-relaxed ${theme.classes.textSecondary}`}>
                  Each category starts at 100 and loses points for failed rules based on severity: critical (-40), high (-25), medium (-10), info (-5).
                  Final score is a weighted average (SSH 25%, Auth 20%, Firewall 25%, Container 15%, Storage 10%, API 5%), then mapped to grade A-F.
                </p>
              </section>

              <section className={`rounded-lg border p-3 ${theme.classes.cardBorder}`} style={{ background: 'var(--pg-accent-dim)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className={`w-4 h-4 ${theme.classes.accent}`} />
                  <h3 className={`text-sm font-semibold ${theme.classes.textPrimary}`}>Privacy Guarantee</h3>
                </div>
                <p className={`text-sm ${theme.classes.textSecondary}`}>
                  Your configs stay local. ProxGuard does not upload, transmit, or store your configuration contents on any server.
                </p>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Inner Shell (needs theme context) ──────────────────────────────────────

function AppShell() {
  const theme = useTheme();
  const [isTransparencyOpen, setIsTransparencyOpen] = useState(false);

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
            <button
              type="button"
              onClick={() => setIsTransparencyOpen(true)}
              className="underline underline-offset-2 decoration-dotted hover:opacity-100 opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-sm transition-opacity"
              style={{
                color: 'inherit',
                textUnderlineOffset: '2px',
                textDecorationColor: 'var(--pg-accent)',
                '--tw-ring-color': 'var(--pg-accent)',
                '--tw-ring-offset-color': 'var(--pg-bg)',
              }}
            >
              100% client-side — your configs never leave your browser
            </button>
          </div>
          <div className={`text-xs ${theme.classes.textSecondary} opacity-60`}>
            ProxGuard v0.1.0 • {theme.name} theme
          </div>
        </div>
      </footer>

      <TransparencyModal open={isTransparencyOpen} onClose={() => setIsTransparencyOpen(false)} />
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
