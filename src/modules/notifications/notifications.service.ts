import { Injectable, ForbiddenException, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { User } from "@prisma/client";
import { NotificationQueueService } from "./queue/notification-queue.service";

import { IsString, IsNotEmpty, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class PushKeysDto {
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  auth: string;
}

export class PushSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @ValidateNested()
  @Type(() => PushKeysDto)
  keys: PushKeysDto;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: NotificationQueueService
  ) {}

  private validateTenantUser(user: User) {
    if (!user.tenantId) {
      throw new ForbiddenException("Master Admin cannot access party isolated data");
    }
    return user.tenantId;
  }

  async findAll(user: User) {
    const tenantId = this.validateTenantUser(user);
    const notifications = await this.prisma.notification.findMany({
      where: { tenantId },
      orderBy: { timestamp: "desc" },
    });
    return {
      success: true,
      data: notifications,
    };
  }

  async markAsRead(user: User, id: string) {
    const tenantId = this.validateTenantUser(user);
    const existing = await this.prisma.notification.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Notification not found");

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return {
      success: true,
      data: updated,
    };
  }

  // Unified trigger to queue a background notification dispatch
  async sendNotification(
    tenantId: string,
    message: string,
    module: string,
    type: string,
    details: string
  ) {
    this.logger.log(`Queueing notification: [${module}] ${message}`);

    // Build the WhatsApp broadcast details payload
    const partners = await this.prisma.user.findMany({
      where: { tenantId, role: "PARTNER" },
    });
    const whatsappDestinations = partners.map((p) => p.fullName).join(", ") || "No active partners";
    const whatsappMsg = `[WhatsApp Alert to Partners (${whatsappDestinations})]: Admin made changes in ${module}: ${message}. Record payload: ${details}`;

    // Delegate to the RxJS background queue system
    this.queueService.addJob(tenantId, {
      message,
      type,
      module,
      whatsappSent: true,
      whatsappMessageDetails: whatsappMsg,
    });
  }

  // Save push subscription for browser push notifications
  async subscribeToPush(user: User, dto: PushSubscriptionDto) {
    const userId = (user as any).sub || user.id;

    // If subscription already exists, return it
    const existing = await this.prisma.pushSubscription.findUnique({
      where: { endpoint: dto.endpoint },
    });

    if (existing) {
      // Update userId if it has changed
      const updated = await this.prisma.pushSubscription.update({
        where: { endpoint: dto.endpoint },
        data: { userId },
      });
      return { success: true, data: updated };
    }

    const created = await this.prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
      },
    });

    return {
      success: true,
      data: created,
    };
  }
}
