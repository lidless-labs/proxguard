/**
 * AnimatedGauge — Circular SVG gauge with animated score.
 * Transitions through red→orange→yellow→green based on score.
 * Shows grade letter in center.
 */
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Grade } from '../types';

/** Map score to a hex color on the red→orange→yellow→green gradient */
function scoreToColor(score: number): string {
  if (score >= 90) return '#10b981'; // emerald-500
  if (score >= 80) return '#22c55e'; // green-500
  if (score >= 70) return '#eab308'; // yellow-500
  if (score >= 60) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

/** Map grade to glow color class */
function gradeGlow(grade: Grade): string {
  const map: Record<Grade, string> = {
    A: 'drop-shadow(0 0 20px rgba(16,185,129,0.4))',
    B: 'drop-shadow(0 0 20px rgba(34,197,94,0.4))',
    C: 'drop-shadow(0 0 20px rgba(234,179,8,0.3))',
    D: 'drop-shadow(0 0 20px rgba(249,115,22,0.3))',
    F: 'drop-shadow(0 0 20px rgba(239,68,68,0.4))',
  };
  return map[grade];
}

interface AnimatedGaugeProps {
  score: number;
  grade: Grade;
  size?: number;
}

export function AnimatedGauge({ score, grade, size = 200 }: AnimatedGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const motionScore = useMotionValue(0);

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
  const dashOffset = useTransform(
    motionScore,
    [0, 100],
    [circumference, 0]
  );

  const color = scoreToColor(score);

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.1 }}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size, filter: gradeGlow(grade) }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-800"
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
          style={{ color }}
        >
          {grade}
        </motion.span>
        <span className="text-lg font-bold text-gray-300 tabular-nums">
          {displayScore}<span className="text-gray-500 text-sm">/100</span>
        </span>
      </div>
    </motion.div>
  );
}
