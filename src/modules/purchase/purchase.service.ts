import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { User, UserRole } from "@prisma/client";

@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  private validateTenantUser(user: User) {
    if (!user.tenantId) {
      throw new ForbiddenException("Master Admin cannot access party isolated data");
    }
    return user.tenantId;
  }

  async findAll(user: User) {
    const tenantId = this.validateTenantUser(user);
    const purchases = await this.prisma.purchase.findMany({
      where: { tenantId },
      orderBy: { date: "desc" },
    });
    return {
      success: true,
      data: purchases,
    };
  }

  async create(user: User, data: any) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const purchase = await this.prisma.purchase.create({
      data: {
        ...data,
        tenantId,
      },
    });

    // Automatically trigger notification for partners
    await this.triggerPartnerNotification(
      tenantId,
      `New purchase of ${purchase.quantity} ${purchase.unit} of "${purchase.itemName}" from ${purchase.supplierName}`,
      "Purchase",
      "create",
      JSON.stringify(data)
    );

    return {
      success: true,
      data: purchase,
    };
  }

  async update(user: User, id: string, data: any) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const existing = await this.prisma.purchase.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Purchase record not found");

    const purchase = await this.prisma.purchase.update({
      where: { id },
      data,
    });

    await this.triggerPartnerNotification(
      tenantId,
      `Updated purchase record "${purchase.itemName}"`,
      "Purchase",
      "update",
      JSON.stringify(data)
    );

    return {
      success: true,
      data: purchase,
    };
  }

  async delete(user: User, id: string) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const existing = await this.prisma.purchase.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Purchase record not found");

    await this.prisma.purchase.delete({
      where: { id },
    });

    await this.triggerPartnerNotification(
      tenantId,
      `Deleted purchase record of "${existing.itemName}"`,
      "Purchase",
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
