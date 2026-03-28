'use client';

import { Suspense, useRef, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOverview, useTopProducts, useRecentActivity } from '@/hooks/use-analytics';
import { RevenueCards } from '@/components/dashboard/RevenueCards';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { EventBarChart } from '@/components/dashboard/EventBarChart';
import { TopProductsTable } from '@/components/dashboard/TopProductsTable';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { SkeletonCard } from '@/components/dashboard/shared';
import { RefreshCw } from 'lucide-react';

// Replace with your actual store_id from seed output
const DEFAULT_STORE_ID = '89bad71c-a781-4b34-b828-716bd2c4dcfd';

function DashboardContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('store_id') || DEFAULT_STORE_ID;

  const overview = useOverview(storeId);
  const topProducts = useTopProducts(storeId);
  const recentActivity = useRecentActivity(storeId);

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (overview.data || topProducts.data || recentActivity.data) {
      setLastUpdated(new Date());
    }
  }, [overview.data, topProducts.data, recentActivity.data]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lastUpdated]);

  const handleRefresh = useCallback(() => {
    overview.mutate();
    topProducts.mutate();
    recentActivity.mutate();
    setLastUpdated(new Date());
  }, [overview, topProducts, recentActivity]);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Amboras
              </span>{' '}
              Analytics
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">Store Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500">
              Updated {secondsAgo}s ago
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-emerald-400">Live</span>
            </span>
            <button
              onClick={handleRefresh}
              className="rounded-lg border border-white/10 p-2 transition-colors hover:bg-white/5"
              aria-label="Refresh data"
            >
              <RefreshCw className="h-4 w-4 text-zinc-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard body */}
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <RevenueCards data={overview.data} isLoading={overview.isLoading} error={overview.error} onRetry={() => overview.mutate()} />
        <StatsCards data={overview.data} isLoading={overview.isLoading} error={overview.error} onRetry={() => overview.mutate()} />
        <EventBarChart data={overview.data} isLoading={overview.isLoading} error={overview.error} onRetry={() => overview.mutate()} />
        <div className="grid gap-6 lg:grid-cols-2">
          <TopProductsTable data={topProducts.data} isLoading={topProducts.isLoading} error={topProducts.error} onRetry={() => topProducts.mutate()} />
          <RecentActivityFeed data={recentActivity.data} isLoading={recentActivity.isLoading} error={recentActivity.error} onRetry={() => recentActivity.mutate()} />
        </div>
      </main>
    </>
  );
}

function DashboardFallback() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="h-8 w-48 animate-pulse rounded bg-white/5" />
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Suspense fallback={<DashboardFallback />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
