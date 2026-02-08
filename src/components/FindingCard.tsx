/**
 * Finding card component — theme-aware.
 * Shows a security finding with severity, pass/fail status, evidence,
 * and expandable remediation with copy button.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Terminal,
  BookOpen,
} from 'lucide-react';
import { SeverityBadge } from './SeverityBadge';
import { useTheme } from '../variants/ThemeProvider';
import type { Finding } from '../types';

interface FindingCardProps {
  finding: Finding;
}

export function FindingCard({ finding }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { rule, result } = finding;
  const theme = useTheme();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rule.remediationScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = rule.remediationScript;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`
        border rounded-lg overflow-hidden transition-colors
        ${result.passed
          ? `${theme.classes.card} ${theme.classes.cardBorder} opacity-70`
          : `${theme.classes.card} ${theme.classes.cardBorder}`
        }
      `}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
      >
        {/* Pass/Fail icon */}
        {result.passed ? (
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
        )}

        {/* Severity badge */}
        <SeverityBadge severity={rule.severity} />

        {/* Title */}
        <span className={`text-sm font-medium flex-1 ${result.passed ? theme.classes.textSecondary : theme.classes.textPrimary}`}
          style={{ fontFamily: theme.fonts.body }}
        >
          {rule.title}
        </span>

        {/* Evidence preview */}
        <span className={`text-xs ${theme.classes.textSecondary} hidden sm:block max-w-xs truncate`}
          style={{ fontFamily: theme.fonts.mono }}
        >
          {result.evidence}
        </span>

        {/* Expand chevron */}
        {expanded ? (
          <ChevronUp className={`w-4 h-4 ${theme.classes.textSecondary} shrink-0`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${theme.classes.textSecondary} shrink-0`} />
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-4 space-y-3 border-t ${theme.classes.cardBorder}`}>
              {/* Description */}
              <div className="pt-3">
                <p className={`text-sm ${theme.classes.textSecondary}`}>{rule.description}</p>
              </div>

              {/* Evidence */}
              <div className="rounded-lg p-3" style={{ background: theme.vars['--pg-bg'] }}>
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className={`w-3.5 h-3.5 ${theme.classes.textSecondary}`} />
                  <span className={`text-xs font-semibold ${theme.classes.textSecondary} uppercase`}>Evidence</span>
                </div>
                <p className={`text-sm ${theme.classes.textPrimary}`} style={{ fontFamily: theme.fonts.mono }}>
                  {result.evidence}
                </p>
                {result.details && (
                  <p className={`text-xs ${theme.classes.textSecondary} mt-1`}>{result.details}</p>
                )}
              </div>

              {/* CIS Benchmark reference */}
              {rule.cisBenchmark && (
                <div className={`flex items-center gap-2 text-xs ${theme.classes.textSecondary}`}>
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Reference: {rule.cisBenchmark}</span>
                </div>
              )}

              {/* Remediation (only for failed findings) */}
              {!result.passed && (
                <div className="space-y-2">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <span className="text-xs font-semibold text-blue-400 uppercase mb-1 block">
                      Remediation
                    </span>
                    <p className={`text-sm ${theme.classes.textPrimary}`}>{rule.remediation}</p>
                  </div>

                  {/* Script */}
                  <div className="rounded-lg p-3 relative group" style={{ background: theme.vars['--pg-bg'] }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold ${theme.classes.textSecondary} uppercase`}>
                        Fix Script
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy();
                        }}
                        className={`flex items-center gap-1 text-xs ${theme.classes.textSecondary} hover:opacity-80 transition-opacity`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className={`text-xs ${theme.classes.textPrimary} whitespace-pre-wrap overflow-x-auto`}
                      style={{ fontFamily: theme.fonts.mono }}
                    >
                      {rule.remediationScript}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
