/**
 * AnimatedGauge — Circular SVG gauge with animated score.
 * Theme-aware: uses theme gauge colors, glow, and track overrides.
 */
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from '../variants/ThemeProvider';
import type { Grade } from '../types';

/** Default score→color mapping (used when theme has no colorOverride) */
function scoreToColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#22c55e';
  if (score >= 70) return '#eab308';
  if (score >= 60) return '#f97316';
  return '#ef4444';
}

/** Glow filter based on the gauge color */
function makeGlow(color: string, enabled: boolean): string {
  if (!enabled) return 'none';
  return `drop-shadow(0 0 20px ${color}66)`;
}

interface AnimatedGaugeProps {
  score: number;
  grade: Grade;
  size?: number;
}

export function AnimatedGauge({ score, grade, size = 200 }: AnimatedGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const motionScore = useMotionValue(0);
  const theme = useTheme();

  // SVG circle math
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Animate the score counter
  useEffect(() => {
    const controls = animate(motionScore, score, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    });
    return controls.stop;
  }, [score, motionScore]);

  // Derive stroke dashoffset from motionScore
  const dashOffset = useTransform(motionScore, [0, 100], [circumference, 0]);

  // Theme-aware color
  const color = theme.gauge.colorOverride ?? scoreToColor(score);

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.1 }}
      className="relative inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        filter: makeGlow(color, theme.gauge.glow),
      }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.gauge.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated foreground arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
          className="text-5xl font-black"
          style={{ color, fontFamily: theme.fonts.heading }}
        >
          {grade}
        </motion.span>
        <span className={`text-lg font-bold ${theme.classes.textPrimary} tabular-nums`}>
          {displayScore}<span className={`${theme.classes.textSecondary} text-sm`}>/100</span>
        </span>
      </div>
    </motion.div>
  );
}
