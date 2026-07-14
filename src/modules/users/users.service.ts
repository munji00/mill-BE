import { BadRequestException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../database/prisma.service";
import { CreatePartnerDto } from "./dto/create-partner.dto";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { UserRole } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        tenant: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },

      include: {
        tenant: true,
      },
    });
  }

  async createPartner(
    dto: CreatePartnerDto,
    currentUser: JwtPayload,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        "Email already exists",
      );
    }

    const hashedPassword = await bcrypt.hash(
      dto.password,
      12,
    );

    const partner = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        password: hashedPassword,
        role: UserRole.PARTNER,
        tenantId: currentUser.tenantId,
        adminId: currentUser.sub,
        mobileNumber: dto.mobileNumber,
      },
    });

    const { password, ...safePartner } = partner;

    return {
      success: true,
      message: "Partner created successfully",
      data: safePartner,
    };
  }

  async findPartners(tenantId: string) {
    const partners = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: UserRole.PARTNER,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      message: "Partners fetched successfully",
      data: partners,
    };
  }
}