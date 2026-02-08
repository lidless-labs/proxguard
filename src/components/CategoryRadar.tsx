/**
 * CategoryRadar — Recharts RadarChart showing all 6 category scores.
 * Theme-aware: reads chart colors from the active variant theme.
 */
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useTheme } from '../variants/ThemeProvider';
import type { CategoryScore, AuditCategory } from '../types';

/** Friendly label for each category */
const categoryLabels: Record<AuditCategory, string> = {
  ssh: 'SSH',
  auth: 'Auth',
  firewall: 'Firewall',
  container: 'Containers',
  storage: 'Storage',
  api: 'API',
};

interface CategoryRadarProps {
  categories: CategoryScore[];
}

export function CategoryRadar({ categories }: CategoryRadarProps) {
  const theme = useTheme();

  const data = categories.map((cat) => ({
    category: categoryLabels[cat.category],
    score: cat.score,
    fullMark: 100,
  }));

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke={theme.chartColors.grid} strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: theme.chartColors.text, fontSize: 12, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: theme.chartColors.text, fontSize: 10 }}
            tickCount={5}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke={theme.chartColors.primary}
            fill={theme.chartColors.fill}
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.vars['--pg-card'],
              border: `1px solid ${theme.vars['--pg-border']}`,
              borderRadius: '8px',
              color: theme.vars['--pg-text'],
              fontSize: '13px',
            }}
            formatter={(value: number | string) => [`${value}/100`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
