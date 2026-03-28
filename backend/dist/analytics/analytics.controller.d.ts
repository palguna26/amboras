import { AnalyticsService } from './analytics.service';
import { StoreIdDto } from './dto/store-id.dto';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getOverview(query: StoreIdDto): Promise<{
        revenue: {
            today: number;
            this_week: number;
            this_month: number;
        };
        events: Record<string, number>;
        conversion_rate: number;
        total_orders: number;
    }>;
    getTopProducts(query: StoreIdDto): Promise<{
        products: {
            product_id: string;
            total_revenue: number;
            order_count: number;
        }[];
    }>;
    getRecentActivity(query: StoreIdDto): Promise<{
        events: import("./analytics.service").RecentEvent[];
    }>;
}
