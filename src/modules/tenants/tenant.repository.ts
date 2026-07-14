import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class TenantRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  create(data: any) {
    return this.prisma.tenant.create({
      data,
    });
  }

  findByCode(code: string) {
    return this.prisma.tenant.findUnique({
      where: {
        code,
      },
    });
  }

  findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: {
        id,
      },
    });
  }

  findAll() {
    return this.prisma.tenant.findMany();
  }
}