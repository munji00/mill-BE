import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { UserRole } from "@prisma/client";

@Injectable()
export class UserRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  create(data: any) {
    return this.prisma.user.create({
      data,
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  findPartners(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        role: UserRole.PARTNER,
      },
    });
  }
}