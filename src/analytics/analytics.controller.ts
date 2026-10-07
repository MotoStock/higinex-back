import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { AnalyticsService } from './analytics.service';
import { GetReportQueryDto } from './dto/get-report-query.dto';

@Controller('analytics')
@Auth(Role.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.analyticsService.getDashboardSummary();
  }

  @Get('report')
  getReport(@Query() query: GetReportQueryDto) {
    return this.analyticsService.getReport(
      new Date(query.from),
      new Date(query.to),
    );
  }
}
