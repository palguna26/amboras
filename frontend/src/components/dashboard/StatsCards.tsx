'use client';

import { ArrowRight, ShoppingCart } from 'lucide-react';
import type { OverviewData } from '@/lib/api';
import { SectionError, SkeletonCard } from './shared';

interface Props {
  data?: OverviewData;
  isLoading: boolean;
  error?: Error;
  onRetry: () => void;
}

export function StatsCards({ data, isLoading, error, onRetry }: Props) {
  if (error) return <SectionError message={error.message} onRetry={onRetry} />;

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Conversion Rate */}
      <div className="rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Conversion Rate</span>
          <ArrowRight className="h-5 w-5 text-yellow-400" />
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight">
          {(data.conversion_rate * 100).toFixed(2)}%
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {data.events.purchase?.toLocaleString() || 0} purchases / {data.events.page_view?.toLocaleString() || 0} views
        </p>
      </div>

      {/* Total Orders */}
      <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/20 to-green-500/5 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Total Orders</span>
          <ShoppingCart className="h-5 w-5 text-green-400" />
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight">
          {data.total_orders.toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-zinc-500">All-time purchases</p>
      </div>
    </div>
  );
}
