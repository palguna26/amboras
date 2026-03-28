'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { OverviewData } from '@/lib/api';
import { SectionError, SkeletonCard } from './shared';

interface Props {
  data?: OverviewData;
  isLoading: boolean;
  error?: Error;
  onRetry: () => void;
}

const EVENT_COLORS: Record<string, string> = {
  page_view: '#6B7280',
  add_to_cart: '#3B82F6',
  remove_from_cart: '#F97316',
  checkout_started: '#EAB308',
  purchase: '#22C55E',
};

const EVENT_LABELS: Record<string, string> = {
  page_view: 'Page Views',
  add_to_cart: 'Add to Cart',
  remove_from_cart: 'Remove from Cart',
  checkout_started: 'Checkout Started',
  purchase: 'Purchases',
};

export function EventBarChart({ data, isLoading, error, onRetry }: Props) {
  if (error) return <SectionError message={error.message} onRetry={onRetry} />;

  if (isLoading || !data) {
    return <SkeletonCard className="h-80" />;
  }

  const chartData = Object.entries(data.events).map(([type, count]) => ({
    name: EVENT_LABELS[type] || type,
    count,
    color: EVENT_COLORS[type] || '#6B7280',
  }));

  return (
    <div className="rounded-xl border border-white/5 bg-[#12121a] p-6">
      <h2 className="mb-4 text-lg font-semibold text-zinc-200">
        Event Distribution
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#71717a', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#1f1f2e' }}
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#e4e4e7',
            }}
            formatter={(value: unknown) => [Number(value).toLocaleString(), 'Events']}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </div>
        ))}
      </div>
    </div>
  );
}
