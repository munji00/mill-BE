import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "./dto/login.dto";
import { UsersService } from "../users/users.service";
import { PrismaService } from "../../database/prisma.service";
import * as bcrypt from "bcrypt"
import { JwtPayload } from "./interfaces/jwt-payload.interface";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { LogoutDto } from "./dto/log-out.dto";


@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.isActive) {
            throw new UnauthorizedException("User account is inactive");
        }

        if (
            user.role !== "MASTER_ADMIN" &&
            (!user.tenant || !user.tenant.isActive)
        ) {
            throw new UnauthorizedException("Tenant is inactive");
        }

        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        const refreshToken = await this.createRefreshToken(user.id);
        const { password: _, ...safeUser } = user;

        return {
            success: true,
            message: "Login successful",
            data: {
                accessToken,
                refreshToken,
                user: safeUser,
            },
            meta: null,
            errors: null,
        };
    }

    async refresh(dto: RefreshTokenDto) {
        const session = await this.prisma.refreshToken.findUnique({
            where: {
                token: dto.refreshToken,
            },
            include: {
                user: {
                    include: {
                        tenant: true,
                    },
                },
            },
        });

        if (!session || session.revoked) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        if (session.expiresAt < new Date()) {
            throw new UnauthorizedException("Refresh token expired");
        }

        // Invalidate old refresh token
        await this.prisma.refreshToken.delete({
            where: {
                id: session.id,
            },
        });

        const payload = {
            sub: session.user.id,
            email: session.user.email,
            role: session.user.role,
            tenantId: session.user.tenantId,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        // Create new refresh token
        const refreshToken = await this.createRefreshToken(session.user.id);

        return {
            success: true,
            message: "Token refreshed",
            data: {
                accessToken,
                refreshToken,
            },
        };
    }

    async logout(dto: LogoutDto) {
        await this.prisma.refreshToken.updateMany({
            where: {
                token: dto.refreshToken,
            },
            data: {
                revoked: true,
            },
        });

        return {
            success: true,
            message: "Logged out successfully",
            data: null,
        };
    }

    private async createRefreshToken(userId: string) {
        const token = crypto.randomUUID();

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });

        return token;
    }

    async me(userId: string) {
        const user = await this.usersService.findById(userId);

        if (!user) {
            throw new UnauthorizedException();
        }

        const { password, ...safeUser } = user;

        return {
            success: true,
            message: "User fetched successfully",
            data: safeUser,
        };
    }


}