import { Body, Controller, Post, Get, Put, Delete, Param, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';
import { TenantsService } from './tenants.service';

import { UpdateTenantDto } from './dto/update-tenant.dto';

@Controller('tenants')
export class TenantsController {
    constructor(
        private readonly tenantService: TenantsService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MASTER_ADMIN)
    create(
        @Body() dto: CreateTenantDto,
    ) {
        return this.tenantService.create(dto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MASTER_ADMIN)
    findAll() {
        return this.tenantService.findAll();
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MASTER_ADMIN)
    update(
        @Param('id') id: string,
        @Body() dto: UpdateTenantDto,
    ) {
        return this.tenantService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.MASTER_ADMIN)
    delete(
        @Param('id') id: string,
    ) {
        return this.tenantService.delete(id);
    }
}
