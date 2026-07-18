import { Module } from "@nestjs/common";
import { ExpensesService } from "./expenses.service";
import { ExpensesController } from "./expenses.controller";
import { DatabaseModule } from "../../database/database.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
