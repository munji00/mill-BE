import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { User, UserRole } from "@prisma/client";

import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  private validateTenantUser(user: User) {
    if (!user.tenantId) {
      throw new ForbiddenException("Master Admin cannot access party isolated data");
    }
    return user.tenantId;
  }

  async findAll(user: User) {
    const tenantId = this.validateTenantUser(user);
    const items = await this.prisma.inventory.findMany({
      where: { tenantId },
      orderBy: { itemName: "asc" },
    });
    return {
      success: true,
      data: items,
    };
  }

  async create(user: User, data: any) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const item = await this.prisma.inventory.create({
      data: {
        ...data,
        tenantId,
      },
    });

    await this.notificationsService.sendNotification(
      tenantId,
      `New inventory item created: "${item.itemName}"`,
      "Inventory",
      "create",
      JSON.stringify(data)
    );

    return {
      success: true,
      data: item,
    };
  }

  async update(user: User, id: string, data: any) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const existing = await this.prisma.inventory.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Inventory item not found");

    const item = await this.prisma.inventory.update({
      where: { id },
      data,
    });

    await this.notificationsService.sendNotification(
      tenantId,
      `Updated stock for inventory item "${item.itemName}" to ${item.stockQuantity} ${item.unit}`,
      "Inventory",
      "update",
      JSON.stringify(data)
    );

    return {
      success: true,
      data: item,
    };
  }

  async delete(user: User, id: string) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const existing = await this.prisma.inventory.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Inventory item not found");

    await this.prisma.inventory.delete({
      where: { id },
    });

    await this.notificationsService.sendNotification(
      tenantId,
      `Deleted inventory item "${existing.itemName}"`,
      "Inventory",
      "delete",
      `ID: ${id}`
    );

    return {
      success: true,
      data: { id },
    };
  }

}
