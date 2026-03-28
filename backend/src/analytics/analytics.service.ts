import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface EventCount {
  event_type: string;
  count: number;
}

interface TopProduct {
  product_id: string;
  total_revenue: number;
  order_count: number;
}

export interface RecentEvent {
  event_id: string;
  event_type: string;
  timestamp: string;
  product_id: string | null;
  amount: number | null;
  currency: string | null;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  /** Validate store exists, throw 404 if not */
  async validateStore(storeId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Store '${storeId}' not found`);
    }
  }

  /** GET /overview — revenue breakdown, event counts, conversion rate */
  async getOverview(storeId: string) {
    await this.validateStore(storeId);

    const now = new Date();
    const todayMidnightUTC = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    ).toISOString();

    // Start of current ISO week (Monday)
    const dayOfWeek = now.getUTCDay(); // 0=Sun … 6=Sat
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday),
    );
    const weekStartStr = weekStart.toISOString().slice(0, 10); // YYYY-MM-DD

    // Start of current month
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const monthStartStr = monthStart.toISOString().slice(0, 10);

    // --- Revenue today: live from events ---
    const { data: todayPurchases, error: todayErr } = await this.supabase
      .from('events')
      .select('amount')
      .eq('store_id', storeId)
      .eq('event_type', 'purchase')
      .gte('timestamp', todayMidnightUTC);

    if (todayErr) {
      this.logger.error(`Revenue today query failed: ${todayErr.message}`);
      throw new BadRequestException('Failed to fetch revenue data');
    }

    const revenueToday = (todayPurchases || []).reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0,
    );

    // --- Revenue this week: from daily_stats ---
    const { data: weekStats, error: weekErr } = await this.supabase
      .from('daily_stats')
      .select('total_revenue')
      .eq('store_id', storeId)
      .gte('date', weekStartStr);

    if (weekErr) {
      this.logger.error(`Revenue week query failed: ${weekErr.message}`);
      throw new BadRequestException('Failed to fetch weekly revenue');
    }

    const revenueThisWeek = (weekStats || []).reduce(
      (sum, s) => sum + (Number(s.total_revenue) || 0),
      0,
    );

    // --- Revenue this month: from daily_stats ---
    const { data: monthStats, error: monthErr } = await this.supabase
      .from('daily_stats')
      .select('total_revenue')
      .eq('store_id', storeId)
      .gte('date', monthStartStr);

    if (monthErr) {
      this.logger.error(`Revenue month query failed: ${monthErr.message}`);
      throw new BadRequestException('Failed to fetch monthly revenue');
    }

    const revenueThisMonth = (monthStats || []).reduce(
      (sum, s) => sum + (Number(s.total_revenue) || 0),
      0,
    );

    // --- Event counts via RPC ---
    const { data: eventCounts, error: countsErr } = await this.supabase.rpc(
      'get_event_counts',
      { p_store_id: storeId },
    );

    if (countsErr) {
      this.logger.error(`Event counts RPC failed: ${countsErr.message}`);
      throw new BadRequestException('Failed to fetch event counts');
    }

    const events: Record<string, number> = {
      page_view: 0,
      add_to_cart: 0,
      remove_from_cart: 0,
      checkout_started: 0,
      purchase: 0,
    };

    for (const row of (eventCounts as EventCount[]) || []) {
      events[row.event_type] = Number(row.count);
    }

    const conversionRate =
      events.page_view > 0
        ? Math.round((events.purchase / events.page_view) * 10000) / 10000
        : 0;

    return {
      revenue: {
        today: Math.round(revenueToday * 100) / 100,
        this_week: Math.round(revenueThisWeek * 100) / 100,
        this_month: Math.round(revenueThisMonth * 100) / 100,
      },
      events,
      conversion_rate: conversionRate,
      total_orders: events.purchase,
    };
  }

  /** GET /top-products — top 10 by revenue via RPC */
  async getTopProducts(storeId: string) {
    await this.validateStore(storeId);

    // Default to last 30 days
    const fromDate = new Date();
    fromDate.setUTCDate(fromDate.getUTCDate() - 30);
    const fromStr = fromDate.toISOString().slice(0, 10);

    const { data, error } = await this.supabase.rpc('get_top_products', {
      p_store_id: storeId,
      p_from: fromStr,
    });

    if (error) {
      this.logger.error(`Top products RPC failed: ${error.message}`);
      throw new BadRequestException('Failed to fetch top products');
    }

    return {
      products: ((data as TopProduct[]) || []).map((p) => ({
        product_id: p.product_id,
        total_revenue: Math.round(Number(p.total_revenue) * 100) / 100,
        order_count: Number(p.order_count),
      })),
    };
  }

  /** GET /recent-activity — last 20 events */
  async getRecentActivity(storeId: string) {
    await this.validateStore(storeId);

    const { data, error } = await this.supabase
      .from('events')
      .select('event_id, event_type, timestamp, product_id, amount, currency')
      .eq('store_id', storeId)
      .order('timestamp', { ascending: false })
      .limit(20);

    if (error) {
      this.logger.error(`Recent activity query failed: ${error.message}`);
      throw new BadRequestException('Failed to fetch recent activity');
    }

    return {
      events: (data as RecentEvent[]) || [],
    };
  }
}
