import useSWR from 'swr';
import {
  buildUrl,
  overviewFetcher,
  topProductsFetcher,
  recentActivityFetcher,
  type OverviewData,
  type TopProductsData,
  type RecentActivityData,
} from '@/lib/api';

const SWR_OPTIONS = {
  refreshInterval: 30_000,
  revalidateOnFocus: false,
  dedupingInterval: 5_000,
} as const;

export function useOverview(storeId: string) {
  return useSWR<OverviewData>(
    storeId ? buildUrl('overview', storeId) : null,
    overviewFetcher,
    SWR_OPTIONS,
  );
}

export function useTopProducts(storeId: string) {
  return useSWR<TopProductsData>(
    storeId ? buildUrl('top-products', storeId) : null,
    topProductsFetcher,
    SWR_OPTIONS,
  );
}

export function useRecentActivity(storeId: string) {
  return useSWR<RecentActivityData>(
    storeId ? buildUrl('recent-activity', storeId) : null,
    recentActivityFetcher,
    SWR_OPTIONS,
  );
}
