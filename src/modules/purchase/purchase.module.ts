import { Module } from "@nestjs/common";
import { PurchaseService } from "./purchase.service";
import { PurchaseController } from "./purchase.controller";
import { DatabaseModule } from "../../database/database.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [PurchaseController],
  providers: [PurchaseService],
  exports: [PurchaseService],
})
export class PurchaseModule {}
