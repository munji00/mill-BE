import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) { }

    @Post("partners")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    createPartner(
        @Body() dto: CreatePartnerDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.usersService.createPartner(dto, user);
    }

    @Get("partners")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.PARTNER)
    findPartners(
        @CurrentUser() user: JwtPayload,
    ) {
        return this.usersService.findPartners(user.tenantId as string);
    }
}
