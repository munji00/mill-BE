import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { User, UserRole } from "@prisma/client";

@Injectable()
export class LabourService {
  constructor(private readonly prisma: PrismaService) {}

  private validateTenantUser(user: User) {
    if (!user.tenantId) {
      throw new ForbiddenException("Master Admin cannot access party isolated data");
    }
    return user.tenantId;
  }

  async findAll(user: User) {
    const tenantId = this.validateTenantUser(user);
    const labours = await this.prisma.labour.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return {
      success: true,
      data: labours,
    };
  }

  async create(user: User, data: any) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const labour = await this.prisma.labour.create({
      data: {
        ...data,
        tenantId,
      },
    });

    await this.triggerPartnerNotification(
      tenantId,
      `New labour registered: "${labour.name}" (${labour.role})`,
      "Labour",
      "create",
      JSON.stringify(data)
    );

    return {
      success: true,
      data: labour,
    };
  }

  async update(user: User, id: string, data: any) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const existing = await this.prisma.labour.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Labour record not found");

    const labour = await this.prisma.labour.update({
      where: { id },
      data,
    });

    await this.triggerPartnerNotification(
      tenantId,
      `Updated details for labour "${labour.name}"`,
      "Labour",
      "update",
      JSON.stringify(data)
    );

    return {
      success: true,
      data: labour,
    };
  }

  async delete(user: User, id: string) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const existing = await this.prisma.labour.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Labour record not found");

    await this.prisma.labour.delete({
      where: { id },
    });

    await this.triggerPartnerNotification(
      tenantId,
      `Removed labour record for "${existing.name}"`,
      "Labour",
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
