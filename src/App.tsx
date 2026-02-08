/**
 * ProxGuard — Main App Layout
 * Routes, header, footer, and navigation shell.
 */
import { Routes, Route, NavLink } from 'react-router-dom';
import { Shield, History, Lock } from 'lucide-react';
import { AuditPage } from './components/AuditPage';
import { HistoryPage } from './components/HistoryPage';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Brand */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold text-gray-100 tracking-tight">
                Prox<span className="text-emerald-400">Guard</span>
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest -mt-0.5">
                Security Auditor
              </span>
            </div>
          </NavLink>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
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
                  isActive
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`
              }
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </NavLink>
          </nav>
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
      <footer className="border-t border-gray-800/60 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Lock className="w-3.5 h-3.5 text-emerald-500/70" />
            <span>100% client-side — your configs never leave your browser</span>
          </div>
          <div className="text-xs text-gray-600">
            ProxGuard v0.1.0 • Proxmox Security Auditor
          </div>
        </div>
      </footer>
    </div>
  );
}
