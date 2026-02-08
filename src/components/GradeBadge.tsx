/**
 * Large color-coded grade badge component.
 * Displays the overall security grade (A-F) with appropriate coloring.
 * Uses universal severity colors (works across all themes).
 */
import { motion } from 'framer-motion';
import type { Grade } from '../types';

const gradeColors: Record<Grade, { bg: string; text: string; ring: string; glow: string }> = {
  A: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500/50', glow: 'shadow-emerald-500/25' },
  B: { bg: 'bg-green-500/20', text: 'text-green-400', ring: 'ring-green-500/50', glow: 'shadow-green-500/25' },
  C: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', ring: 'ring-yellow-500/50', glow: 'shadow-yellow-500/25' },
  D: { bg: 'bg-orange-500/20', text: 'text-orange-400', ring: 'ring-orange-500/50', glow: 'shadow-orange-500/25' },
  F: { bg: 'bg-red-500/20', text: 'text-red-400', ring: 'ring-red-500/50', glow: 'shadow-red-500/25' },
};

interface GradeBadgeProps {
  grade: Grade;
  score: number;
  size?: 'sm' | 'lg';
}

export function GradeBadge({ grade, score, size = 'lg' }: GradeBadgeProps) {
  const colors = gradeColors[grade];
  const isLarge = size === 'lg';

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`flex flex-col items-center justify-center ${isLarge ? 'gap-2' : 'gap-1'}`}
    >
      <div
        className={`
          ${colors.bg} ${colors.ring} ${colors.glow}
          ${isLarge ? 'w-32 h-32' : 'w-16 h-16'}
          rounded-full ring-2 shadow-lg
          flex items-center justify-center
        `}
      >
        <span className={`${colors.text} ${isLarge ? 'text-6xl' : 'text-2xl'} font-black`}>
          {grade}
        </span>
      </div>
      <div className="text-center">
        <span className={`${colors.text} ${isLarge ? 'text-2xl' : 'text-sm'} font-bold`}>
          {score}/100
        </span>
      </div>
    </motion.div>
  );
}
