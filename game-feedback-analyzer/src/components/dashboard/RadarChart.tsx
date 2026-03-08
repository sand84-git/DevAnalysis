'use client';

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { RadarChartData } from '@/types';

interface RadarChartProps {
  data: RadarChartData;
}

const CHART_COLORS = {
  fill: '#82B1FF',
  stroke: '#82B1FF',
};

export default function RadarChart({ data }: RadarChartProps) {
  const chartData = data.categories.map((category, i) => ({
    category,
    value: data.values[i] ?? 0,
  }));

  return (
    <div className="rounded-[10px] border border-border bg-dark-bg p-6">
      <h3 className="mb-4 font-display text-lg text-dark-text">
        카테고리 분포 — {data.buildName}
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <RechartsRadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#333333" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: '#C8BCA8', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            tick={{ fill: '#C8BCA8', fontSize: 10 }}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E1E2A',
              border: '1px solid #333333',
              borderRadius: 8,
              color: '#E8E0D0',
            }}
          />
          <Radar
            name={data.buildName}
            dataKey="value"
            stroke={CHART_COLORS.stroke}
            fill={CHART_COLORS.fill}
            fillOpacity={0.3}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
