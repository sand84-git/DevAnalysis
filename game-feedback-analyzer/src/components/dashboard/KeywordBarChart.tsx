'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { KeywordBarData } from '@/types';

interface KeywordBarChartProps {
  data: KeywordBarData[];
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#A5D6A7',
  enthusiastic: '#FFD54F',
  constructive_negative: '#82B1FF',
  frustrated: '#FF8A80',
  neutral: '#C8BCA8',
  mixed: '#CE93D8',
};

const SENTIMENT_LABELS: Record<string, string> = {
  positive: '긍정',
  enthusiastic: '열광',
  constructive_negative: '건설적 부정',
  frustrated: '불만',
  neutral: '중립',
  mixed: '혼합',
};

export default function KeywordBarChart({ data }: KeywordBarChartProps) {
  const chartData = data.map((item) => ({
    keyword: item.keyword,
    ...item.sentiment,
  }));

  const sentimentKeys = Object.keys(SENTIMENT_COLORS);

  return (
    <div className="rounded-[10px] border border-border bg-dark-bg p-6">
      <h3 className="mb-4 font-display text-lg text-dark-text">
        키워드 빈도 및 감정 분석
      </h3>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333333" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#C8BCA8', fontSize: 12 }} />
          <YAxis
            dataKey="keyword"
            type="category"
            tick={{ fill: '#C8BCA8', fontSize: 12 }}
            width={80}
          />
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
              <span style={{ color: '#C8BCA8' }}>
                {SENTIMENT_LABELS[value] ?? value}
              </span>
            )}
          />
          {sentimentKeys.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="sentiment"
              fill={SENTIMENT_COLORS[key]}
              name={key}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
