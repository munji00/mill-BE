import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { User } from "@prisma/client";
import { ExpensesService } from "./expenses.service";

@Controller("expenses")
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) { }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.expensesService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() data: any) {
    return this.expensesService.create(user, data);
  }

  @Put(":id")
  update(@CurrentUser() user: User, @Param("id") id: string, @Body() data: any) {
    return this.expensesService.update(user, id, data);
  }

  @Delete(":id")
  delete(@CurrentUser() user: User, @Param("id") id: string) {
    return this.expensesService.delete(user, id);
  }
}
