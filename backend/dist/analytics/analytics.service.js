"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    supabaseService;
    logger = new common_1.Logger(AnalyticsService_1.name);
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    get supabase() {
        return this.supabaseService.getClient();
    }
    async validateStore(storeId) {
        const { data, error } = await this.supabase
            .from('stores')
            .select('id')
            .eq('id', storeId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException(`Store '${storeId}' not found`);
        }
    }
    async getOverview(storeId) {
        await this.validateStore(storeId);
        const now = new Date();
        const todayMidnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
        const dayOfWeek = now.getUTCDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday));
        const weekStartStr = weekStart.toISOString().slice(0, 10);
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const monthStartStr = monthStart.toISOString().slice(0, 10);
        const { data: todayPurchases, error: todayErr } = await this.supabase
            .from('events')
            .select('amount')
            .eq('store_id', storeId)
            .eq('event_type', 'purchase')
            .gte('timestamp', todayMidnightUTC);
        if (todayErr) {
            this.logger.error(`Revenue today query failed: ${todayErr.message}`);
            throw new common_1.BadRequestException('Failed to fetch revenue data');
        }
        const revenueToday = (todayPurchases || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const { data: weekStats, error: weekErr } = await this.supabase
            .from('daily_stats')
            .select('total_revenue')
            .eq('store_id', storeId)
            .gte('date', weekStartStr);
        if (weekErr) {
            this.logger.error(`Revenue week query failed: ${weekErr.message}`);
            throw new common_1.BadRequestException('Failed to fetch weekly revenue');
        }
        const revenueThisWeek = (weekStats || []).reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0);
        const { data: monthStats, error: monthErr } = await this.supabase
            .from('daily_stats')
            .select('total_revenue')
            .eq('store_id', storeId)
            .gte('date', monthStartStr);
        if (monthErr) {
            this.logger.error(`Revenue month query failed: ${monthErr.message}`);
            throw new common_1.BadRequestException('Failed to fetch monthly revenue');
        }
        const revenueThisMonth = (monthStats || []).reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0);
        const { data: eventCounts, error: countsErr } = await this.supabase.rpc('get_event_counts', { p_store_id: storeId });
        if (countsErr) {
            this.logger.error(`Event counts RPC failed: ${countsErr.message}`);
            throw new common_1.BadRequestException('Failed to fetch event counts');
        }
        const events = {
            page_view: 0,
            add_to_cart: 0,
            remove_from_cart: 0,
            checkout_started: 0,
            purchase: 0,
        };
        for (const row of eventCounts || []) {
            events[row.event_type] = Number(row.count);
        }
        const conversionRate = events.page_view > 0
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
    async getTopProducts(storeId) {
        await this.validateStore(storeId);
        const fromDate = new Date();
        fromDate.setUTCDate(fromDate.getUTCDate() - 30);
        const fromStr = fromDate.toISOString().slice(0, 10);
        const { data, error } = await this.supabase.rpc('get_top_products', {
            p_store_id: storeId,
            p_from: fromStr,
        });
        if (error) {
            this.logger.error(`Top products RPC failed: ${error.message}`);
            throw new common_1.BadRequestException('Failed to fetch top products');
        }
        return {
            products: (data || []).map((p) => ({
                product_id: p.product_id,
                total_revenue: Math.round(Number(p.total_revenue) * 100) / 100,
                order_count: Number(p.order_count),
            })),
        };
    }
    async getRecentActivity(storeId) {
        await this.validateStore(storeId);
        const { data, error } = await this.supabase
            .from('events')
            .select('event_id, event_type, timestamp, product_id, amount, currency')
            .eq('store_id', storeId)
            .order('timestamp', { ascending: false })
            .limit(20);
        if (error) {
            this.logger.error(`Recent activity query failed: ${error.message}`);
            throw new common_1.BadRequestException('Failed to fetch recent activity');
        }
        return {
            events: data || [],
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map