'use client';

import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import type { OverviewData } from '@/lib/api';
import { SectionError, SkeletonCard } from './shared';

interface Props {
  data?: OverviewData;
  isLoading: boolean;
  error?: Error;
  onRetry: () => void;
}

const cards = [
  { key: 'today' as const, label: 'Revenue Today', icon: DollarSign, gradient: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400', border: 'border-emerald-500/20' },
  { key: 'this_week' as const, label: 'Revenue This Week', icon: TrendingUp, gradient: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400', border: 'border-blue-500/20' },
  { key: 'this_month' as const, label: 'Revenue This Month', icon: Calendar, gradient: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-400', border: 'border-violet-500/20' },
] as const;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export function RevenueCards({ data, isLoading, error, onRetry }: Props) {
  if (error) return <SectionError message={error.message} onRetry={onRetry} />;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        if (isLoading || !data) {
          return <SkeletonCard key={card.key} />;
        }
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className={`rounded-xl border ${card.border} bg-gradient-to-br ${card.gradient} p-5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{card.label}</span>
              <Icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {formatCurrency(data.revenue[card.key])}
            </p>
          </div>
        );
      })}
    </div>
  );
}
