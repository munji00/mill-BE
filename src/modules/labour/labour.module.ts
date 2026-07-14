import { Module } from "@nestjs/common";
import { LabourService } from "./labour.service";
import { LabourController } from "./labour.controller";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [LabourController],
  providers: [LabourService],
  exports: [LabourService],
})
export class LabourModule {}
