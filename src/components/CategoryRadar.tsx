/**
 * CategoryRadar — Recharts RadarChart showing all 6 category scores.
 * Dark theme styling with emerald accent.
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
  const data = categories.map((cat) => ({
    category: categoryLabels[cat.category],
    score: cat.score,
    fullMark: 100,
  }));

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#374151" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickCount={5}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: '13px',
            }}
            formatter={(value: number | string) => [`${value}/100`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
