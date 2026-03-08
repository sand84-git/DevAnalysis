'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import type { TrendLineData } from '@/types';

interface TrendLineChartProps {
  data: TrendLineData[];
}

const LINE_COLORS = ['#FF8A80', '#FFD54F', '#82B1FF', '#CE93D8', '#A5D6A7'];

export default function TrendLineChart({ data }: TrendLineChartProps) {
  // Build a unified dataset keyed by buildName
  const buildNames = data.length > 0
    ? data[0].points.map((p) => p.buildName)
    : [];

  const chartData = buildNames.map((buildName) => {
    const entry: Record<string, string | number> = { buildName };
    data.forEach((trend) => {
      const point = trend.points.find((p) => p.buildName === buildName);
      if (point) {
        entry[trend.keyword] = point.ratio;
        entry[`${trend.keyword}_low`] = point.confidenceLow;
        entry[`${trend.keyword}_high`] = point.confidenceHigh;
      }
    });
    return entry;
  });

  return (
    <div className="rounded-[10px] border border-border bg-dark-bg p-6">
      <h3 className="mb-4 font-display text-lg text-dark-text">
        빌드별 키워드 트렌드
      </h3>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
          <XAxis
            dataKey="buildName"
            tick={{ fill: '#C8BCA8', fontSize: 12 }}
          />
          <YAxis tick={{ fill: '#C8BCA8', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E1E2A',
              border: '1px solid #333333',
              borderRadius: 8,
              color: '#E8E0D0',
            }}
          />
          <Legend
            formatter={(value: string) => (
              <span style={{ color: '#C8BCA8' }}>{value}</span>
            )}
          />
          {data.map((trend, i) => (
            <Area
              key={`area-${trend.keyword}`}
              dataKey={`${trend.keyword}_high`}
              stroke="none"
              fill={LINE_COLORS[i % LINE_COLORS.length]}
              fillOpacity={0.08}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              baseLine={chartData.map((d) => Number(d[`${trend.keyword}_low`] ?? 0)) as any}
              name={`${trend.keyword} CI`}
              legendType="none"
              tooltipType="none"
            />
          ))}
          {data.map((trend, i) => (
            <Line
              key={trend.keyword}
              type="monotone"
              dataKey={trend.keyword}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              name={trend.keyword}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
