import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { StoreIdDto } from './dto/store-id.dto';

@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  getOverview(@Query() query: StoreIdDto) {
    return this.analyticsService.getOverview(query.store_id);
  }

  @Get('top-products')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  getTopProducts(@Query() query: StoreIdDto) {
    return this.analyticsService.getTopProducts(query.store_id);
  }

  @Get('recent-activity')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  getRecentActivity(@Query() query: StoreIdDto) {
    return this.analyticsService.getRecentActivity(query.store_id);
  }
}
