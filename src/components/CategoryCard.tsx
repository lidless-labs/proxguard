/**
 * Category score card component.
 * Shows category name, score, and a visual progress bar.
 */
import { motion } from 'framer-motion';
import {
  Shield,
  Key,
  Flame,
  Box,
  HardDrive,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import type { AuditCategory, CategoryScore } from '../types';

const categoryConfig: Record<AuditCategory, { icon: LucideIcon; label: string; color: string }> = {
  ssh: { icon: Key, label: 'SSH', color: 'emerald' },
  auth: { icon: Shield, label: 'Authentication', color: 'blue' },
  firewall: { icon: Flame, label: 'Firewall', color: 'orange' },
  container: { icon: Box, label: 'Containers', color: 'purple' },
  storage: { icon: HardDrive, label: 'Storage', color: 'cyan' },
  api: { icon: Globe, label: 'API', color: 'pink' },
};

function getScoreColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 80) return 'bg-green-500';
  if (score >= 70) return 'bg-yellow-500';
  if (score >= 60) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 80) return 'text-green-400';
  if (score >= 70) return 'text-yellow-400';
  if (score >= 60) return 'text-orange-400';
  return 'text-red-400';
}

interface CategoryCardProps {
  categoryScore: CategoryScore;
  index: number;
}

export function CategoryCard({ categoryScore, index }: CategoryCardProps) {
  const config = categoryConfig[categoryScore.category];
  const Icon = config.icon;
  const failedCount = categoryScore.findings.filter(f => !f.result.passed).length;
  const passedCount = categoryScore.findings.filter(f => f.result.passed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-200">{config.label}</span>
        </div>
        <span className={`text-lg font-bold ${getScoreTextColor(categoryScore.score)}`}>
          {categoryScore.score}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-700/50 rounded-full h-2 mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${categoryScore.score}%` }}
          transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
          className={`h-2 rounded-full ${getScoreColor(categoryScore.score)}`}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="text-green-400">{passedCount} passed</span>
        {failedCount > 0 && (
          <span className="text-red-400">{failedCount} failed</span>
        )}
      </div>
    </motion.div>
  );
}
