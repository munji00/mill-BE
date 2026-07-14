import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { User } from "@prisma/client";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
