/**
 * Finding card component.
 * Shows a security finding with severity, pass/fail status, evidence, and expandable remediation.
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
import type { Finding } from '../types';

interface FindingCardProps {
  finding: Finding;
}

export function FindingCard({ finding }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { rule, result } = finding;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rule.remediationScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS contexts
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
          ? 'bg-gray-800/30 border-gray-700/30'
          : 'bg-gray-800/50 border-gray-700/50'
        }
      `}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-700/20 transition-colors"
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
        <span className={`text-sm font-medium flex-1 ${result.passed ? 'text-gray-400' : 'text-gray-200'}`}>
          {rule.title}
        </span>

        {/* Evidence preview */}
        <span className="text-xs text-gray-500 hidden sm:block max-w-xs truncate">
          {result.evidence}
        </span>

        {/* Expand chevron */}
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
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
            <div className="px-4 pb-4 space-y-3 border-t border-gray-700/30">
              {/* Description */}
              <div className="pt-3">
                <p className="text-sm text-gray-400">{rule.description}</p>
              </div>

              {/* Evidence */}
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase">Evidence</span>
                </div>
                <p className="text-sm text-gray-300 font-mono">{result.evidence}</p>
                {result.details && (
                  <p className="text-xs text-gray-500 mt-1">{result.details}</p>
                )}
              </div>

              {/* CIS Benchmark reference */}
              {rule.cisBenchmark && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
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
                    <p className="text-sm text-gray-300">{rule.remediation}</p>
                  </div>

                  {/* Script */}
                  <div className="bg-gray-900/80 rounded-lg p-3 relative group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        Fix Script
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy();
                        }}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
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
                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto">
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
