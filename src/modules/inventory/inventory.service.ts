import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { User, UserRole } from "@prisma/client";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

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

    await this.triggerPartnerNotification(
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

    await this.triggerPartnerNotification(
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

    await this.triggerPartnerNotification(
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

  private async triggerPartnerNotification(
    tenantId: string,
    message: string,
    module: string,
    type: string,
    details: string
  ) {
    const partners = await this.prisma.user.findMany({
      where: { tenantId, role: UserRole.PARTNER },
    });

    const whatsappDestinations = partners.map((p) => p.fullName).join(", ") || "No active partners";
    const whatsappMsg = `[WhatsApp Alert to Partners (${whatsappDestinations})]: Admin made changes in ${module}: ${message}. Record payload: ${details}`;

    await this.prisma.notification.create({
      data: {
        message,
        tenantId,
        type,
        module,
        whatsappSent: true,
        whatsappMessageDetails: whatsappMsg,
      },
    });
  }
}
