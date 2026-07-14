import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { User } from "@prisma/client";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.inventoryService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() data: any) {
    return this.inventoryService.create(user, data);
  }

  @Put(":id")
  update(@CurrentUser() user: User, @Param("id") id: string, @Body() data: any) {
    return this.inventoryService.update(user, id, data);
  }

  @Delete(":id")
  delete(@CurrentUser() user: User, @Param("id") id: string) {
    return this.inventoryService.delete(user, id);
  }
}
