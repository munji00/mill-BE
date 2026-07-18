import { Controller, Get, Param, Put, Post, Body, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { User } from "@prisma/client";
import { NotificationsService, PushSubscriptionDto } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.notificationsService.findAll(user);
  }

  @Put(":id")
  markAsRead(@CurrentUser() user: User, @Param("id") id: string) {
    return this.notificationsService.markAsRead(user, id);
  }

  @Post("push-subscribe")
  subscribeToPush(@CurrentUser() user: User, @Body() dto: PushSubscriptionDto) {
    return this.notificationsService.subscribeToPush(user, dto);
  }
}
