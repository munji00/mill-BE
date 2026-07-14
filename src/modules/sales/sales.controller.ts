import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { User } from "@prisma/client";
import { SalesService } from "./sales.service";

@Controller("sales")
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) { }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.salesService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() data: any) {
    return this.salesService.create(user, data);
  }

  @Put(":id")
  update(@CurrentUser() user: User, @Param("id") id: string, @Body() data: any) {
    return this.salesService.update(user, id, data);
  }

  @Delete(":id")
  delete(@CurrentUser() user: User, @Param("id") id: string) {
    return this.salesService.delete(user, id);
  }
}
