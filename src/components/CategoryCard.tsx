/**
 * Category score card component — theme-aware.
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
import { useTheme } from '../variants/ThemeProvider';
import type { AuditCategory, CategoryScore } from '../types';

const categoryConfig: Record<AuditCategory, { icon: LucideIcon; label: string }> = {
  ssh: { icon: Key, label: 'SSH' },
  auth: { icon: Shield, label: 'Authentication' },
  firewall: { icon: Flame, label: 'Firewall' },
  container: { icon: Box, label: 'Containers' },
  storage: { icon: HardDrive, label: 'Storage' },
  api: { icon: Globe, label: 'API' },
};

/** Score color — used for progress bar fill (universal severity colors) */
function getScoreBarColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#22c55e';
  if (score >= 70) return '#eab308';
  if (score >= 60) return '#f97316';
  return '#ef4444';
}

interface CategoryCardProps {
  categoryScore: CategoryScore;
  index: number;
}

export function CategoryCard({ categoryScore, index }: CategoryCardProps) {
  const theme = useTheme();
  const config = categoryConfig[categoryScore.category];
  const Icon = config.icon;
  const failedCount = categoryScore.findings.filter((f) => !f.result.passed).length;
  const passedCount = categoryScore.findings.filter((f) => f.result.passed).length;
  const barColor = getScoreBarColor(categoryScore.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`${theme.classes.card} rounded-xl p-4 border ${theme.classes.cardBorder}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${theme.classes.textSecondary}`} />
          <span className={`text-sm font-semibold ${theme.classes.textPrimary}`}
            style={{ fontFamily: theme.fonts.heading }}
          >
            {config.label}
          </span>
        </div>
        <span className="text-lg font-bold" style={{ color: barColor }}>
          {categoryScore.score}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full rounded-full h-2 mb-3" style={{ background: theme.gauge.track }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${categoryScore.score}%` }}
          transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
          className="h-2 rounded-full"
          style={{ backgroundColor: barColor }}
        />
      </div>

      <div className={`flex items-center justify-between text-xs ${theme.classes.textSecondary}`}>
        <span className="text-green-400">{passedCount} passed</span>
        {failedCount > 0 && (
          <span className="text-red-400">{failedCount} failed</span>
        )}
      </div>
    </motion.div>
  );
}
