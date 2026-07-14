import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { User, UserRole } from "@prisma/client";

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  private validateTenantUser(user: User) {
    if (!user.tenantId) {
      throw new ForbiddenException("Master Admin cannot access party isolated data");
    }
    return user.tenantId;
  }

  async findAll(user: User) {
    const tenantId = this.validateTenantUser(user);
    const expenses = await this.prisma.expense.findMany({
      where: { tenantId },
      orderBy: { date: "desc" },
    });
    return {
      success: true,
      data: expenses,
    };
  }

  async create(user: User, data: any) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const expense = await this.prisma.expense.create({
      data: {
        ...data,
        tenantId,
      },
    });

    await this.triggerPartnerNotification(
      tenantId,
      `New expense added: "${expense.category}" of Rs. ${expense.amount}`,
      "Expenses",
      "create",
      JSON.stringify(data)
    );

    return {
      success: true,
      data: expense,
    };
  }

  async update(user: User, id: string, data: any) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const existing = await this.prisma.expense.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Expense record not found");

    const expense = await this.prisma.expense.update({
      where: { id },
      data,
    });

    await this.triggerPartnerNotification(
      tenantId,
      `Updated expense record: "${expense.category}"`,
      "Expenses",
      "update",
      JSON.stringify(data)
    );

    return {
      success: true,
      data: expense,
    };
  }

  async delete(user: User, id: string) {
    const tenantId = this.validateTenantUser(user);
    if (user.role === UserRole.PARTNER) {
      throw new ForbiddenException("Partners are read-only");
    }

    const existing = await this.prisma.expense.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Expense record not found");

    await this.prisma.expense.delete({
      where: { id },
    });

    await this.triggerPartnerNotification(
      tenantId,
      `Deleted expense record: "${existing.category}"`,
      "Expenses",
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
