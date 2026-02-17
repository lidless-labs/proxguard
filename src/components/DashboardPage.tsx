import { motion } from 'framer-motion';
import { Home, Plus, History, RotateCcw, TrendingUp, Shield, Activity } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuditStore } from '../store/auditStore';
import { useTheme } from '../variants/ThemeProvider';
import type { Grade } from '../types';

const gradeColors: Record<Grade, string> = {
  A: 'text-emerald-400 bg-emerald-500/15',
  B: 'text-green-400 bg-green-500/15',
  C: 'text-yellow-400 bg-yellow-500/15',
  D: 'text-orange-400 bg-orange-500/15',
  F: 'text-red-400 bg-red-500/15',
};

const gradeRank: Record<Grade, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 };

export function DashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const history = useAuditStore((s) => s.history);
  const loadSample = useAuditStore((s) => s.loadSample);
  const loadLastConfig = useAuditStore((s) => s.loadLastConfig);
  const lastConfigInputs = useAuditStore((s) => s.lastConfigInputs);

  const lastAudit = history[0] ?? null;

  const chartData = useMemo(
    () => [...history].slice(0, 10).reverse().map((entry, index) => ({
      idx: index + 1,
      score: entry.overallScore,
    })),
    [history]
  );

  const stats = useMemo(() => {
    if (history.length === 0) {
      return {
        total: 0,
        average: 0,
        bestGrade: null as Grade | null,
      };
    }

    const total = history.length;
    const average = Math.round(history.reduce((acc, item) => acc + item.overallScore, 0) / total);
    const bestGrade = history.reduce<Grade>((best, item) => (
      gradeRank[item.overallGrade] > gradeRank[best] ? item.overallGrade : best
    ), history[0].overallGrade);

    return { total, average, bestGrade };
  }, [history]);

  const hasLastConfig = Object.values(lastConfigInputs).some((v) => v.trim().length > 0);

  const startWithSample = (sample: 'insecure' | 'partial' | 'hardened') => {
    loadSample(sample);
    navigate('/audit');
  };

  const onLoadLastConfig = () => {
    loadLastConfig();
    navigate('/audit');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-2xl p-6 md:p-8`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${theme.vars['--pg-accent']}22` }}>
                <Shield className={`w-6 h-6 ${theme.classes.accent}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${theme.classes.textPrimary}`} style={{ fontFamily: theme.fonts.heading }}>
                  ProxGuard Dashboard
                </h1>
                <p className={`text-sm ${theme.classes.textSecondary}`}>
                  Quickly launch audits, review your trend, and continue where you left off.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/audit')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 ${theme.classes.button}`}
          >
            <Plus className="w-4 h-4" />
            New Audit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {history.length > 0 ? (
            <>
              <div className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-2xl p-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-xs uppercase tracking-wider ${theme.classes.textSecondary}`}>Last audit</p>
                    <p className={`text-sm ${theme.classes.textSecondary} mt-1`}>
                      {new Date(lastAudit!.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradeColors[lastAudit!.overallGrade]}`}>
                    <span className="text-2xl font-black">{lastAudit!.overallGrade}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className={`text-lg font-semibold ${theme.classes.textPrimary}`}>Score: {lastAudit!.overallScore}/100</p>
                  <button
                    onClick={() => navigate('/history')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${theme.classes.navInactive}`}
                  >
                    View Details
                  </button>
                </div>
              </div>

              <div className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className={`w-4 h-4 ${theme.classes.accent}`} />
                  <p className={`text-sm font-semibold ${theme.classes.textPrimary}`}>Score Trend (Last 10)</p>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--pg-accent)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--pg-accent)" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="idx" hide />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid var(--pg-border)',
                          background: 'var(--pg-card)',
                          color: 'var(--pg-text)',
                        }}
                        labelFormatter={(value) => `Audit #${value}`}
                        formatter={(value) => [`${value}/100`, 'Score']}
                      />
                      <Area type="monotone" dataKey="score" stroke="var(--pg-accent)" fill="url(#scoreGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-2xl p-5`}
            >
              <p className={`text-lg font-semibold ${theme.classes.textPrimary}`} style={{ fontFamily: theme.fonts.heading }}>
                Get started quickly
              </p>
              <p className={`text-sm ${theme.classes.textSecondary} mt-1 mb-4`}>
                Launch with a sample baseline to see how ProxGuard scoring behaves.
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => startWithSample('insecure')} className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-500/15 text-red-400 hover:bg-red-500/25">Insecure Sample</button>
                <button onClick={() => startWithSample('partial')} className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500/15 text-amber-400 hover:bg-amber-500/25">Partial Sample</button>
                <button onClick={() => startWithSample('hardened')} className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25">Hardened Sample</button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <div className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-2xl p-5`}>
            <p className={`text-sm font-semibold ${theme.classes.textPrimary} mb-3`}>Quick Stats</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${theme.classes.textSecondary}`}>Total Audits</span>
                <span className={`text-sm font-semibold ${theme.classes.textPrimary}`}>{stats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${theme.classes.textSecondary}`}>Best Grade</span>
                <span className={`text-sm font-semibold ${theme.classes.textPrimary}`}>{stats.bestGrade ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${theme.classes.textSecondary}`}>Average Score</span>
                <span className={`text-sm font-semibold ${theme.classes.textPrimary}`}>{stats.total > 0 ? `${stats.average}/100` : '—'}</span>
              </div>
            </div>
          </div>

          <div className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-2xl p-5`}>
            <p className={`text-sm font-semibold ${theme.classes.textPrimary} mb-3`}>Quick Actions</p>
            <div className="space-y-2">
              <button onClick={() => navigate('/audit')} className={`w-full px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${theme.classes.navInactive}`}>
                <Home className="w-4 h-4" />
                New Audit
              </button>
              <button onClick={() => navigate('/history')} className={`w-full px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${theme.classes.navInactive}`}>
                <History className="w-4 h-4" />
                View History
              </button>
              <button
                onClick={onLoadLastConfig}
                disabled={!hasLastConfig}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${hasLastConfig ? theme.classes.navInactive : theme.classes.buttonDisabled}`}
              >
                <RotateCcw className="w-4 h-4" />
                Load Last Config
              </button>
            </div>
          </div>

          <div className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-2xl p-5`}>
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${theme.classes.accent}`} />
              <p className={`text-sm ${theme.classes.textSecondary}`}>Client-side analysis, zero server upload.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
