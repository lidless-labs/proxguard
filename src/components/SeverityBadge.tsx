/**
 * Severity badge component for findings.
 * Color-coded by severity level.
 */
import type { Severity } from '../types';

const severityConfig: Record<Severity, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'CRITICAL' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'HIGH' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'MEDIUM' },
  info: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'INFO' },
};

interface SeverityBadgeProps {
  severity: Severity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = severityConfig[severity];

  return (
    <span
      className={`
        ${config.bg} ${config.text}
        px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider
        inline-flex items-center
      `}
    >
      {config.label}
    </span>
  );
}
