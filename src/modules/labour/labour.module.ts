import { Module } from "@nestjs/common";
import { LabourService } from "./labour.service";
import { LabourController } from "./labour.controller";
import { DatabaseModule } from "../../database/database.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [LabourController],
  providers: [LabourService],
  exports: [LabourService],
})
export class LabourModule {}
