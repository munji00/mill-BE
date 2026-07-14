import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";

import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

const cleanString = (val?: string) => (val && val.trim() !== "" ? val.trim() : null);

@Injectable()
export class TenantsService {
    constructor(
        private readonly prisma: PrismaService,
    ){}

    async create(dto: CreateTenantDto) {
  console.log("[DEBUG create tenant] received DTO payload:", dto);
  const {
    tenantName,
    code,
  } = dto;

  const adminName = dto.adminName || `${tenantName} Admin`;
  const adminEmail = dto.adminEmail || `admin@${code.toLowerCase()}.com`;
  const adminPassword = dto.adminPassword || "Admin@123";

  const existingUser = await this.prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
  });

  if (existingUser) {
    throw new BadRequestException(
      "Admin email already exists",
    );
  }

  const existingTenant = await this.prisma.tenant.findUnique({
    where: {
      code,
    },
  });

  if (existingTenant) {
    throw new BadRequestException(
      "Tenant code already exists",
    );
  }

  const password = await bcrypt.hash(
    adminPassword,
    12,
  );

  const result = await this.prisma.$transaction(
    async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          code,
          email: cleanString(dto.email),
          contactNumber: cleanString(dto.contactNumber),
          registerNumber: cleanString(dto.registerNumber),
          ownerName: cleanString(dto.ownerName),
          ownerMobile: cleanString(dto.ownerMobile),
          state: cleanString(dto.state),
          city: cleanString(dto.city),
          townOrVillage: cleanString(dto.townOrVillage),
        },
      });

      // Calculate next subscription expiration date
      const months = dto.subscriptionMonths || 3;
      const nextSubscription = new Date();
      nextSubscription.setMonth(nextSubscription.getMonth() + months);

      await tx.subscription.create({
        data: {
          type: "FREE_TRIAL",
          isActive: true,
          nextSubscription,
          tenantId: tenant.id,
        },
      });

      const admin = await tx.user.create({
        data: {
          fullName: adminName,
          email: adminEmail,
          password,
          role: UserRole.ADMIN,
          tenantId: tenant.id,
        },
      });

      return {
        tenant,
        admin,
      };
    },
  );

  const { password: _, ...safeAdmin } = result.admin;

  return {
    success: true,
    message: "Tenant created successfully",
    data: {
      tenant: result.tenant,
      admin: safeAdmin,
    },
  };
}

  async findAll() {
    const tenants = await this.prisma.tenant.findMany({
      include: {
        subscription: true,
      },
    });
    return {
      success: true,
      data: tenants,
    };
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        email: dto.email !== undefined ? cleanString(dto.email) : undefined,
        contactNumber: dto.contactNumber !== undefined ? cleanString(dto.contactNumber) : undefined,
        registerNumber: dto.registerNumber !== undefined ? cleanString(dto.registerNumber) : undefined,
        ownerName: dto.ownerName !== undefined ? cleanString(dto.ownerName) : undefined,
        ownerMobile: dto.ownerMobile !== undefined ? cleanString(dto.ownerMobile) : undefined,
        state: dto.state !== undefined ? cleanString(dto.state) : undefined,
        city: dto.city !== undefined ? cleanString(dto.city) : undefined,
        townOrVillage: dto.townOrVillage !== undefined ? cleanString(dto.townOrVillage) : undefined,
      },
      include: {
        subscription: true,
      },
    });
    return {
      success: true,
      data: tenant,
    };
  }

  async delete(id: string) {
    await this.prisma.tenant.delete({
      where: { id },
    });
    return {
      success: true,
      data: { id },
    };
  }
}
