import { Navigate } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { useAuditStore } from '../store/auditStore';
import { useTheme } from '../variants/ThemeProvider';
import { SeverityBadge } from './SeverityBadge';
import type { Finding } from '../types';

function PassFailBadge({ passed }: { passed: boolean }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
        passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
      }`}
    >
      {passed ? 'PASS' : 'FAIL'}
    </span>
  );
}

export function CompliancePage() {
  const theme = useTheme();
  const auditReport = useAuditStore((s) => s.auditReport);

  if (!auditReport) {
    return <Navigate to="/" replace />;
  }

  const mappedFindings = auditReport.findings.filter((f) => Boolean(f.rule.cisBenchmark));
  const unmappedFindings = auditReport.findings.filter((f) => !f.rule.cisBenchmark);

  const groupedMappedFindings = mappedFindings.reduce<Record<string, Finding[]>>((acc, finding) => {
    const benchmark = finding.rule.cisBenchmark as string;
    if (!acc[benchmark]) acc[benchmark] = [];
    acc[benchmark].push(finding);
    return acc;
  }, {});

  const sortedBenchmarkIds = Object.keys(groupedMappedFindings).sort((a, b) => a.localeCompare(b));
  const passingMapped = mappedFindings.filter((f) => f.result.passed).length;
  const totalMapped = mappedFindings.length;
  const compliancePercent = totalMapped === 0 ? 0 : Math.round((passingMapped / totalMapped) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className={`rounded-xl border p-5 ${theme.classes.card} ${theme.classes.cardBorder}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardCheck className={`w-5 h-5 ${theme.classes.accent}`} />
              <h1 className={`text-xl font-bold ${theme.classes.textPrimary}`} style={{ fontFamily: theme.fonts.heading }}>
                CIS Compliance
              </h1>
            </div>
            <p className={`text-sm ${theme.classes.textSecondary}`}>
              {passingMapped}/{totalMapped} CIS-mapped checks passing
            </p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-black ${theme.classes.textPrimary}`} style={{ fontFamily: theme.fonts.heading }}>
              {compliancePercent}%
            </p>
            <p className={`text-xs uppercase tracking-wider ${theme.classes.textSecondary}`}>Compliance</p>
          </div>
        </div>
      </div>

      <section className={`rounded-xl border p-5 ${theme.classes.card} ${theme.classes.cardBorder}`}>
        <h2 className={`text-lg font-semibold mb-4 ${theme.classes.textPrimary}`} style={{ fontFamily: theme.fonts.heading }}>
          CIS Mapped Findings
        </h2>

        {sortedBenchmarkIds.length === 0 ? (
          <p className={`text-sm ${theme.classes.textSecondary}`}>No findings are currently mapped to CIS benchmarks.</p>
        ) : (
          <div className="space-y-4">
            {sortedBenchmarkIds.map((benchmarkId) => (
              <div key={benchmarkId} className={`rounded-lg border p-4 ${theme.classes.cardBorder}`}>
                <p className={`text-sm font-semibold mb-3 ${theme.classes.accent}`} style={{ fontFamily: theme.fonts.mono }}>
                  {benchmarkId}
                </p>
                <div className="space-y-3">
                  {groupedMappedFindings[benchmarkId].map((finding) => (
                    <div key={finding.rule.id} className="rounded-md border p-3" style={{ borderColor: 'var(--pg-border)' }}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <p className={`font-medium ${theme.classes.textPrimary}`}>{finding.rule.title}</p>
                        <div className="flex items-center gap-2">
                          <PassFailBadge passed={finding.result.passed} />
                          <SeverityBadge severity={finding.rule.severity} />
                        </div>
                      </div>
                      <p className={`text-sm mt-2 ${theme.classes.textSecondary}`}>
                        <span className="font-medium">Evidence:</span> {finding.result.evidence}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={`rounded-xl border p-5 ${theme.classes.card} ${theme.classes.cardBorder}`}>
        <h2 className={`text-lg font-semibold mb-4 ${theme.classes.textPrimary}`} style={{ fontFamily: theme.fonts.heading }}>
          Unmapped Rules
        </h2>

        {unmappedFindings.length === 0 ? (
          <p className="text-sm text-amber-400">All findings are mapped to a benchmark ID.</p>
        ) : (
          <div className="space-y-3">
            {unmappedFindings.map((finding) => (
              <div
                key={finding.rule.id}
                className="rounded-lg border p-3"
                style={{ borderColor: 'rgb(245 158 11 / 0.35)', backgroundColor: 'rgb(245 158 11 / 0.08)' }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <p className={`font-medium ${theme.classes.textPrimary}`}>{finding.rule.title}</p>
                  <div className="flex items-center gap-2">
                    <PassFailBadge passed={finding.result.passed} />
                    <SeverityBadge severity={finding.rule.severity} />
                  </div>
                </div>
                <p className={`text-sm mt-2 ${theme.classes.textSecondary}`}>
                  <span className="font-medium">Evidence:</span> {finding.result.evidence}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
