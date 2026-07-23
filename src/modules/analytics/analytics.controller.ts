import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { User } from "@prisma/client";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  getAnalytics(
    @CurrentUser() user: User,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("name") name?: string,
    @Query("itemName") itemName?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.analyticsService.getAnalytics(user, {
      startDate,
      endDate,
      name,
      itemName,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 100,
    });
  }
}
