/**
 * ScoreSummary — Row of stat cards showing finding counts.
 * Total findings, critical/high/medium/info, pass rate.
 */
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Info,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import type { Finding } from '../types';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  index: number;
}

function StatCard({ label, value, icon, color, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 sm:p-4 flex items-center gap-3"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-gray-100 tabular-nums">{value}</div>
        <div className="text-xs text-gray-400 whitespace-nowrap">{label}</div>
      </div>
    </motion.div>
  );
}

interface ScoreSummaryProps {
  findings: Finding[];
}

export function ScoreSummary({ findings }: ScoreSummaryProps) {
  const total = findings.length;
  const critical = findings.filter((f) => !f.result.passed && f.rule.severity === 'critical').length;
  const high = findings.filter((f) => !f.result.passed && f.rule.severity === 'high').length;
  const medium = findings.filter((f) => !f.result.passed && f.rule.severity === 'medium').length;
  const info = findings.filter((f) => !f.result.passed && f.rule.severity === 'info').length;
  const passed = findings.filter((f) => f.result.passed).length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  const stats = [
    {
      label: 'Total Checks',
      value: total,
      icon: <BarChart3 className="w-5 h-5 text-gray-300" />,
      color: 'bg-gray-700/50',
    },
    {
      label: 'Critical',
      value: critical,
      icon: <AlertOctagon className="w-5 h-5 text-red-400" />,
      color: 'bg-red-500/15',
    },
    {
      label: 'High',
      value: high,
      icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
      color: 'bg-orange-500/15',
    },
    {
      label: 'Medium',
      value: medium,
      icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
      color: 'bg-yellow-500/15',
    },
    {
      label: 'Info',
      value: info,
      icon: <Info className="w-5 h-5 text-blue-400" />,
      color: 'bg-blue-500/15',
    },
    {
      label: 'Pass Rate',
      value: `${passRate}%`,
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      color: 'bg-emerald-500/15',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} index={i} {...stat} />
      ))}
    </div>
  );
}
