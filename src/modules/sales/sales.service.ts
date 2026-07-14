import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { User, UserRole } from "@prisma/client";

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  private validateTenantUser(user: User) {
    if (!user.tenantId) {
      throw new ForbiddenException("Master Admin cannot access party isolated data");
    }
    return user.tenantId;
  }

  async findAll(user: User) {
    const tenantId = this.validateTenantUser(user);
    const sales = await this.prisma.sale.findMany({
      where: { tenantId },
      orderBy: { date: "desc" },
    });
    return {
      success: true,
      data: sales,
    };
  }

  async create(user: User, data: any) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const sale = await this.prisma.sale.create({
      data: {
        ...data,
        tenantId,
      },
    });

    await this.triggerPartnerNotification(
      tenantId,
      `New sales record of ${sale.quantity} ${sale.unit} of "${sale.itemName}" to ${sale.buyerName}`,
      "Sales",
      "create",
      JSON.stringify(data)
    );

    return {
      success: true,
      data: sale,
    };
  }

  async update(user: User, id: string, data: any) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const existing = await this.prisma.sale.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Sales record not found");

    const sale = await this.prisma.sale.update({
      where: { id },
      data,
    });

    await this.triggerPartnerNotification(
      tenantId,
      `Updated sales record "${sale.itemName}"`,
      "Sales",
      "update",
      JSON.stringify(data)
    );

    return {
      success: true,
      data: sale,
    };
  }

  async delete(user: User, id: string) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const existing = await this.prisma.sale.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Sales record not found");

    await this.prisma.sale.delete({
      where: { id },
    });

    await this.triggerPartnerNotification(
      tenantId,
      `Deleted sales record of "${existing.itemName}"`,
      "Sales",
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
