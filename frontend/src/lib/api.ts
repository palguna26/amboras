const API_URL = 'http://localhost:3001';

export interface OverviewData {
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
  };
  events: Record<string, number>;
  conversion_rate: number;
  total_orders: number;
}

export interface TopProductsData {
  products: {
    product_id: string;
    total_revenue: number;
    order_count: number;
  }[];
}

export interface RecentActivityData {
  events: {
    event_id: string;
    event_type: string;
    timestamp: string;
    product_id: string | null;
    amount: number | null;
    currency: string | null;
  }[];
}

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function overviewFetcher(url: string) {
  return fetcher<OverviewData>(url);
}
export function topProductsFetcher(url: string) {
  return fetcher<TopProductsData>(url);
}
export function recentActivityFetcher(url: string) {
  return fetcher<RecentActivityData>(url);
}

export function buildUrl(endpoint: string, storeId: string) {
  return `${API_URL}/api/v1/analytics/${endpoint}?store_id=${storeId}`;
}
