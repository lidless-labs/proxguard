import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowUp, ArrowDown, Minus, GitCompareArrows } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuditStore, hydrateStoredReport } from '../store/auditStore';
import { useTheme } from '../variants/ThemeProvider';
import type { AuditCategory, Grade } from '../types';

const gradeColors: Record<Grade, string> = {
  A: 'text-emerald-400 bg-emerald-500/15',
  B: 'text-green-400 bg-green-500/15',
  C: 'text-yellow-400 bg-yellow-500/15',
  D: 'text-orange-400 bg-orange-500/15',
  F: 'text-red-400 bg-red-500/15',
};

const categoryLabels: Record<AuditCategory, string> = {
  ssh: 'SSH Security',
  firewall: 'Firewall',
  auth: 'Authentication',
  container: 'Container Security',
  api: 'API Security',
  storage: 'Storage',
};

const allCategories: AuditCategory[] = ['ssh', 'auth', 'firewall', 'container', 'storage', 'api'];

function deltaTone(delta: number): string {
  if (delta > 0) return 'text-emerald-400';
  if (delta < 0) return 'text-red-400';
  return 'text-gray-400';
}

function DeltaIndicator({ delta }: { delta: number }) {
  if (delta > 0) {
    return <span className="inline-flex items-center gap-1 text-emerald-400"><ArrowUp className="w-3.5 h-3.5" />+{delta}</span>;
  }
  if (delta < 0) {
    return <span className="inline-flex items-center gap-1 text-red-400"><ArrowDown className="w-3.5 h-3.5" />{delta}</span>;
  }
  return <span className="inline-flex items-center gap-1 text-gray-400"><Minus className="w-3.5 h-3.5" />0</span>;
}

export function ComparisonPage() {
  const theme = useTheme();
  const history = useAuditStore((s) => s.history);
  const comparisonPair = useAuditStore((s) => s.comparisonPair);

  if (!comparisonPair) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-2xl p-8 text-center`}>
          <h1 className={`text-xl font-bold ${theme.classes.textPrimary}`} style={{ fontFamily: theme.fonts.heading }}>
            No comparison selected
          </h1>
          <p className={`mt-2 text-sm ${theme.classes.textSecondary}`}>Go to History and choose exactly two audit runs.</p>
          <Link to="/history" className={`mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme.classes.button}`}>
            <ArrowLeft className="w-4 h-4" /> Back to History
          </Link>
        </div>
      </div>
    );
  }

  const [firstTs, secondTs] = comparisonPair;
  const ordered = [...comparisonPair].sort((a, b) => a - b);
  const reportA = hydrateStoredReport(history.find((h) => h.timestamp === ordered[0]) ?? { timestamp: ordered[0], overallGrade: 'F', overallScore: 0 });
  const reportB = hydrateStoredReport(history.find((h) => h.timestamp === ordered[1]) ?? { timestamp: ordered[1], overallGrade: 'F', overallScore: 0 });

  if (!reportA || !reportB) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-2xl p-8 text-center`}>
          <h1 className={`text-xl font-bold ${theme.classes.textPrimary}`} style={{ fontFamily: theme.fonts.heading }}>
            Unable to compare selected reports
          </h1>
          <p className={`mt-2 text-sm ${theme.classes.textSecondary}`}>One or both selected entries are legacy history items without full finding data.</p>
          <p className={`mt-1 text-xs ${theme.classes.textSecondary} opacity-70`}>Selected timestamps: {firstTs}, {secondTs}</p>
          <Link to="/history" className={`mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme.classes.button}`}>
            <ArrowLeft className="w-4 h-4" /> Back to History
          </Link>
        </div>
      </div>
    );
  }

  const overallDelta = reportB.overallScore - reportA.overallScore;

  const scoresA = new Map(reportA.categories.map((c) => [c.category, c.score]));
  const scoresB = new Map(reportB.categories.map((c) => [c.category, c.score]));

  const findingA = new Map(reportA.findings.map((f) => [f.rule.id, f.result.passed]));
  const findingB = new Map(reportB.findings.map((f) => [f.rule.id, f.result.passed]));

  const improved: string[] = [];
  const regressed: string[] = [];
  const unchanged: string[] = [];
  const newRules: string[] = [];
  const removedRules: string[] = [];

  const allRuleIds = new Set([...findingA.keys(), ...findingB.keys()]);
  allRuleIds.forEach((ruleId) => {
    const before = findingA.get(ruleId);
    const after = findingB.get(ruleId);

    // Rule only exists in report B (new rule added between audits)
    if (before === undefined) { newRules.push(ruleId); return; }
    // Rule only exists in report A (rule removed between audits)
    if (after === undefined) { removedRules.push(ruleId); return; }

    if (before === false && after === true) improved.push(ruleId);
    else if (before === true && after === false) regressed.push(ruleId);
    else unchanged.push(ruleId);
  });

  const titleByRule = new Map([...reportA.findings, ...reportB.findings].map((f) => [f.rule.id, f.rule.title]));

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitCompareArrows className={`w-5 h-5 ${theme.classes.accent}`} />
          <h1 className={`text-2xl font-bold ${theme.classes.textPrimary}`} style={{ fontFamily: theme.fonts.heading }}>
            Audit Comparison
          </h1>
        </div>
        <Link to="/history" className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${theme.classes.navInactive}`}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[reportA, reportB].map((report, idx) => (
          <motion.div
            key={report.timestamp}
            initial={{ opacity: 0, x: idx === 0 ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-2xl p-5`}
          >
            <p className={`text-xs uppercase tracking-wider ${theme.classes.textSecondary}`}>Report {idx === 0 ? 'A' : 'B'}</p>
            <div className="mt-2 flex items-center justify-between">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${gradeColors[report.overallGrade]}`}>
                <span className="text-3xl font-black">{report.overallGrade}</span>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${theme.classes.textPrimary}`}>{report.overallScore}/100</p>
                <p className={`text-xs ${theme.classes.textSecondary}`}>{formatDate(report.timestamp)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-xl p-4 flex items-center justify-between`}>
        <span className={`text-sm ${theme.classes.textSecondary}`}>Overall Score Delta (B - A)</span>
        <span className={`text-base font-semibold ${deltaTone(overallDelta)}`}>
          <DeltaIndicator delta={overallDelta} />
        </span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-2xl p-5`}>
        <h2 className={`text-lg font-semibold ${theme.classes.textPrimary} mb-4`} style={{ fontFamily: theme.fonts.heading }}>Category Comparison</h2>
        <div className="space-y-2">
          {allCategories.map((category) => {
            const aScore = scoresA.get(category) ?? 0;
            const bScore = scoresB.get(category) ?? 0;
            const delta = bScore - aScore;

            return (
              <div key={category} className={`grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center rounded-lg px-3 py-2 border ${theme.classes.cardBorder}`}>
                <span className={`text-sm ${theme.classes.textPrimary}`}>{categoryLabels[category]}</span>
                <span className={`text-sm ${theme.classes.textSecondary}`}>A: {aScore}</span>
                <span className={`text-sm ${theme.classes.textSecondary}`}>B: {bScore}</span>
                <span className={`text-sm font-semibold ${deltaTone(delta)}`}><DeltaIndicator delta={delta} /></span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-xl p-4`}>
          <h3 className="text-sm font-semibold text-emerald-400">Improved ({improved.length})</h3>
          <AnimatePresence>
            <ul className="mt-2 space-y-1">
              {improved.slice(0, 12).map((id) => (
                <motion.li key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-xs ${theme.classes.textSecondary}`}>
                  {titleByRule.get(id) ?? id}
                </motion.li>
              ))}
            </ul>
          </AnimatePresence>
        </div>

        <div className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-xl p-4`}>
          <h3 className="text-sm font-semibold text-red-400">Regressed ({regressed.length})</h3>
          <AnimatePresence>
            <ul className="mt-2 space-y-1">
              {regressed.slice(0, 12).map((id) => (
                <motion.li key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-xs ${theme.classes.textSecondary}`}>
                  {titleByRule.get(id) ?? id}
                </motion.li>
              ))}
            </ul>
          </AnimatePresence>
        </div>

        <div className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-xl p-4`}>
          <h3 className={`text-sm font-semibold ${theme.classes.textPrimary}`}>Unchanged ({unchanged.length})</h3>
          <p className={`mt-2 text-xs ${theme.classes.textSecondary}`}>Includes rules that stayed passing or stayed failing.</p>
        </div>
      </motion.div>

      {(newRules.length > 0 || removedRules.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {newRules.length > 0 && (
            <div className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-xl p-4`}>
              <h3 className="text-sm font-semibold text-cyan-400">New Rules in B ({newRules.length})</h3>
              <ul className="mt-2 space-y-1">
                {newRules.slice(0, 12).map((id) => (
                  <li key={id} className={`text-xs ${theme.classes.textSecondary}`}>{titleByRule.get(id) ?? id}</li>
                ))}
              </ul>
            </div>
          )}
          {removedRules.length > 0 && (
            <div className={`${theme.classes.card} border ${theme.classes.cardBorder} rounded-xl p-4`}>
              <h3 className="text-sm font-semibold text-amber-400">Removed Rules ({removedRules.length})</h3>
              <ul className="mt-2 space-y-1">
                {removedRules.slice(0, 12).map((id) => (
                  <li key={id} className={`text-xs ${theme.classes.textSecondary}`}>{titleByRule.get(id) ?? id}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
