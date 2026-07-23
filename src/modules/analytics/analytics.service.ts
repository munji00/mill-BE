import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { User } from "@prisma/client";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(
    user: User,
    filters: {
      startDate?: string;
      endDate?: string;
      name?: string;
      itemName?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const tenantId = user.tenantId;
    if (!tenantId) {
      throw new ForbiddenException("No tenant context");
    }

    const {
      startDate,
      endDate,
      name,
      itemName,
      page = 1,
      limit = 100,
    } = filters;

    // Fetch all records for the tenant
    const [purchases, sales, expenses, labours] = await Promise.all([
      this.prisma.purchase.findMany({ where: { tenantId } }),
      this.prisma.sale.findMany({ where: { tenantId } }),
      this.prisma.expense.findMany({ where: { tenantId } }),
      this.prisma.labour.findMany({ where: { tenantId } }),
    ]);

    // Map to a unified transaction format
    const allTransactions: any[] = [];

    purchases.forEach((p) => {
      allTransactions.push({
        id: p.id,
        type: "Purchase",
        name: p.supplierName,
        itemName: p.itemName,
        amount: p.totalAmount,
        date: p.date,
        details: `Payment: ${p.paymentStatus} (${p.quantity} ${p.unit})`,
      });
    });

    sales.forEach((s) => {
      allTransactions.push({
        id: s.id,
        type: "Sale",
        name: s.buyerName,
        itemName: s.itemName,
        amount: s.totalAmount,
        date: s.date,
        details: `Buyer (${s.quantity} ${s.unit})`,
      });
    });

    expenses.forEach((e) => {
      allTransactions.push({
        id: e.id,
        type: "Expense",
        name: e.category,
        itemName: e.description,
        amount: e.amount,
        date: e.date,
        details: e.description || "Operational Expense",
      });
    });

    labours.forEach((l) => {
      // Map Labour present days cost as an expense transaction
      const labourDate = l.createdAt ? new Date(l.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
      allTransactions.push({
        id: l.id,
        type: "Labour",
        name: l.name,
        itemName: l.role,
        amount: l.dailyWage * l.presentDays,
        date: labourDate,
        details: `Wage payout for ${l.presentDays} days. Contact: ${l.contact}`,
      });
    });

    // Sort by date descending
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply filters
    const filtered = allTransactions.filter((t) => {
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;

      if (name && !t.name.toLowerCase().includes(name.toLowerCase())) return false;
      if (itemName && !t.itemName.toLowerCase().includes(itemName.toLowerCase())) return false;

      return true;
    });

    // Compute totals based on filtered transactions
    let totalSales = 0;
    let totalPurchase = 0;
    let totalExpenses = 0;

    filtered.forEach((t) => {
      if (t.type === "Sale") {
        totalSales += t.amount;
      } else if (t.type === "Purchase") {
        totalPurchase += t.amount;
      } else {
        totalExpenses += t.amount;
      }
    });

    const netAmount = totalSales - totalPurchase - totalExpenses;

    // Apply pagination
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIdx = (page - 1) * limit;
    const endIdx = page * limit;
    const paginatedData = filtered.slice(startIdx, endIdx);

    return {
      success: true,
      data: paginatedData,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
      summary: {
        totalSales,
        totalPurchase,
        totalExpenses,
        netAmount,
      },
    };
  }
}
