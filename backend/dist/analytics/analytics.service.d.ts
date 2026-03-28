import { SupabaseService } from '../supabase/supabase.service';
export interface RecentEvent {
    event_id: string;
    event_type: string;
    timestamp: string;
    product_id: string | null;
    amount: number | null;
    currency: string | null;
}
export declare class AnalyticsService {
    private readonly supabaseService;
    private readonly logger;
    constructor(supabaseService: SupabaseService);
    private get supabase();
    validateStore(storeId: string): Promise<void>;
    getOverview(storeId: string): Promise<{
        revenue: {
            today: number;
            this_week: number;
            this_month: number;
        };
        events: Record<string, number>;
        conversion_rate: number;
        total_orders: number;
    }>;
    getTopProducts(storeId: string): Promise<{
        products: {
            product_id: string;
            total_revenue: number;
            order_count: number;
        }[];
    }>;
    getRecentActivity(storeId: string): Promise<{
        events: RecentEvent[];
    }>;
}
