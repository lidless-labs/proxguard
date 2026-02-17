/**
 * HistoryPage — Past audit results from localStorage.
 * Theme-aware: uses active theme for all styling.
 */
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Clock, Award, History, ShieldOff, GitCompareArrows } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuditStore, hydrateStoredReport } from '../store/auditStore';
import { useTheme } from '../variants/ThemeProvider';
import type { Grade } from '../types';

/** Grade color mapping (universal — works on any bg) */
const gradeColors: Record<Grade, string> = {
  A: 'text-emerald-400 bg-emerald-500/15',
  B: 'text-green-400 bg-green-500/15',
  C: 'text-yellow-400 bg-yellow-500/15',
  D: 'text-orange-400 bg-orange-500/15',
  F: 'text-red-400 bg-red-500/15',
};

export function HistoryPage() {
  const history = useAuditStore((s) => s.history);
  const clearHistory = useAuditStore((s) => s.clearHistory);
  const setComparisonPair = useAuditStore((s) => s.setComparisonPair);
  const theme = useTheme();
  const navigate = useNavigate();
  const deleteHistoryEntry = useAuditStore((s) => s.deleteHistoryEntry);
  const [selected, setSelected] = useState<number[]>([]);

  const fullReportTimestamps = useMemo(
    () => new Set(history.filter((entry) => hydrateStoredReport(entry) !== null).map((entry) => entry.timestamp)),
    [history]
  );

  /** Delete a single history entry by timestamp */
  const deleteEntry = (timestamp: number) => {
    deleteHistoryEntry(timestamp);
    setSelected((prev) => prev.filter((ts) => ts !== timestamp));
  };

  /** Clear selection when history is cleared */
  const handleClearHistory = () => {
    clearHistory();
    setSelected([]);
  };

  const toggleSelection = (timestamp: number) => {
    setSelected((prev) => {
      if (prev.includes(timestamp)) {
        return prev.filter((ts) => ts !== timestamp);
      }
      if (prev.length >= 2) {
        return [...prev.slice(1), timestamp];
      }
      return [...prev, timestamp];
    });
  };

  const compareSelected = () => {
    if (selected.length !== 2) return;
    setComparisonPair(selected[0], selected[1]);
    navigate('/compare');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${theme.classes.card} border ${theme.classes.cardBorder} flex items-center justify-center`}>
            <History className={`w-5 h-5 ${theme.classes.textSecondary}`} />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${theme.classes.textPrimary}`}
              style={{ fontFamily: theme.fonts.heading }}
            >
              Audit History
            </h1>
            <p className={`text-sm ${theme.classes.textSecondary}`}>
              {history.length} audit{history.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={compareSelected}
            disabled={selected.length !== 2}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${selected.length === 2 ? theme.classes.button : theme.classes.buttonDisabled}`}
          >
            <GitCompareArrows className="w-4 h-4" />
            Compare Selected
          </button>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {history.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <ShieldOff className={`w-16 h-16 ${theme.classes.textSecondary} opacity-30 mx-auto mb-4`} />
          <h2 className={`text-lg font-semibold ${theme.classes.textSecondary} mb-2`}
            style={{ fontFamily: theme.fonts.heading }}
          >
            No audits yet
          </h2>
          <p className={`text-sm ${theme.classes.textSecondary} max-w-sm mx-auto opacity-70`}>
            Run your first security audit from the main page. Results will be saved here
            automatically for comparison.
          </p>
        </motion.div>
      )}

      {/* History list */}
      <div className="space-y-3">
        <AnimatePresence>
          {history.map((entry, i) => {
            const date = new Date(entry.timestamp);
            const formatted = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const canCompare = fullReportTimestamps.has(entry.timestamp);
            const checked = selected.includes(entry.timestamp);

            return (
              <motion.div
                key={entry.timestamp}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-xl p-4 flex items-center justify-between gap-4`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!canCompare}
                    onChange={() => toggleSelection(entry.timestamp)}
                    aria-label={canCompare ? `Select audit from ${formatted} for comparison` : `Legacy entry from ${formatted} cannot be compared`}
                    title={canCompare ? 'Select for comparison' : 'Legacy entry cannot be compared'}
                    className="h-4 w-4 accent-[var(--pg-accent)] disabled:opacity-40"
                  />

                  {/* Grade badge */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      gradeColors[entry.overallGrade]
                    }`}
                  >
                    <span className="text-2xl font-black">{entry.overallGrade}</span>
                  </div>

                  {/* Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Award className={`w-4 h-4 ${theme.classes.textSecondary} shrink-0`} />
                      <span className={`text-sm font-semibold ${theme.classes.textPrimary}`}>
                        Score: {entry.overallScore}/100
                      </span>
                      {!canCompare && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                          legacy
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className={`w-3.5 h-3.5 ${theme.classes.textSecondary} shrink-0`} />
                      <span className={`text-xs ${theme.classes.textSecondary} truncate`}>{formatted}</span>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => deleteEntry(entry.timestamp)}
                  className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                  aria-label={`Delete audit from ${formatted}`}
                  title="Delete this audit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
