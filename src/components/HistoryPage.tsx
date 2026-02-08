/**
 * HistoryPage — Past audit results from localStorage.
 * Shows timestamp, grade, score, and delete controls.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Clock, Award, History, ShieldOff } from 'lucide-react';
import { useAuditStore } from '../store/auditStore';
import type { Grade } from '../types';

/** Grade color mapping */
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

  /** Delete a single history entry by timestamp */
  const deleteEntry = (timestamp: number) => {
    useAuditStore.setState((s) => ({
      history: s.history.filter((e) => e.timestamp !== timestamp),
    }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
            <History className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100">Audit History</h1>
            <p className="text-sm text-gray-500">
              {history.length} audit{history.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Empty state */}
      {history.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <ShieldOff className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-400 mb-2">No audits yet</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
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

            return (
              <motion.div
                key={entry.timestamp}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
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
                      <Award className="w-4 h-4 text-gray-500 shrink-0" />
                      <span className="text-sm font-semibold text-gray-200">
                        Score: {entry.overallScore}/100
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                      <span className="text-xs text-gray-500 truncate">{formatted}</span>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => deleteEntry(entry.timestamp)}
                  className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
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
