import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { User } from "@prisma/client";
import { PurchaseService } from "./purchase.service";

@Controller("purchase")
@UseGuards(JwtAuthGuard)
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) { }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.purchaseService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() data: any) {
    return this.purchaseService.create(user, data);
  }

  @Put(":id")
  update(@CurrentUser() user: User, @Param("id") id: string, @Body() data: any) {
    return this.purchaseService.update(user, id, data);
  }

  @Delete(":id")
  delete(@CurrentUser() user: User, @Param("id") id: string) {
    return this.purchaseService.delete(user, id);
  }
}
