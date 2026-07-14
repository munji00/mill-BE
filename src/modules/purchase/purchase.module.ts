import { Module } from "@nestjs/common";
import { PurchaseService } from "./purchase.service";
import { PurchaseController } from "./purchase.controller";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [PurchaseController],
  providers: [PurchaseService],
  exports: [PurchaseService],
})
export class PurchaseModule {}
