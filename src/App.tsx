/**
 * ProxGuard — Main App Layout
 * Routes, header with variant selector, footer, and navigation shell.
 * Wrapped in ThemeProvider for variant-aware styling.
 */
import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { Shield, History, Lock, X, FileText, Server, AlertTriangle, Calculator, ClipboardCheck, Home, GitCompareArrows } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuditPage } from './components/AuditPage';
import { HistoryPage } from './components/HistoryPage';
import { CompliancePage } from './components/CompliancePage';
import { DashboardPage } from './components/DashboardPage';
import { ComparisonPage } from './components/ComparisonPage';
import { VariantSelector } from './components/VariantSelector';
import { ThemeProvider, useTheme } from './variants/ThemeProvider';
import { useAuditStore } from './store/auditStore';
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
  const auditReport = useAuditStore((s) => s.auditReport);
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
              aria-label="Home"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? theme.classes.navActive : theme.classes.navInactive
                }`
              }
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </NavLink>
            <NavLink
              to="/audit"
              aria-label="Audit"
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
              aria-label="History"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? theme.classes.navActive : theme.classes.navInactive
                }`
              }
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </NavLink>
            <NavLink
              to="/compare"
              aria-label="Compare"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? theme.classes.navActive : theme.classes.navInactive
                }`
              }
            >
              <GitCompareArrows className="w-4 h-4" />
              <span className="hidden sm:inline">Compare</span>
            </NavLink>
            {auditReport && (
              <NavLink
                to="/compliance"
                aria-label="Compliance"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? theme.classes.navActive : theme.classes.navInactive
                  }`
                }
              >
                <ClipboardCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Compliance</span>
              </NavLink>
            )}
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
          <Route path="/" element={<DashboardPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/compare" element={<ComparisonPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
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
              } as React.CSSProperties}
            >
              100% client-side — your configs never leave your browser
            </button>
          </div>
          <div className={`flex items-center gap-3 text-xs ${theme.classes.textSecondary} opacity-60`}>
            <span>ProxGuard v0.1.0</span>
            <span>•</span>
            <a
              href="https://github.com/solomonneas/proxguard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:opacity-100 transition-opacity"
              aria-label="View ProxGuard on GitHub"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              <span>solomonneas</span>
            </a>
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
