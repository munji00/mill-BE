import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { User } from "@prisma/client";
import { LabourService } from "./labour.service";

@Controller("labour")
@UseGuards(JwtAuthGuard)
export class LabourController {
  constructor(private readonly labourService: LabourService) { }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.labourService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() data: any) {
    return this.labourService.create(user, data);
  }

  @Put(":id")
  update(@CurrentUser() user: User, @Param("id") id: string, @Body() data: any) {
    return this.labourService.update(user, id, data);
  }

  @Delete(":id")
  delete(@CurrentUser() user: User, @Param("id") id: string) {
    return this.labourService.delete(user, id);
  }
}
