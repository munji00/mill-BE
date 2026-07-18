import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { DatabaseModule } from "../../database/database.module";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationQueueService } from "./queue/notification-queue.service";
import {
  NotificationDispatcherFactory,
  DatabaseDispatcher,
  SocketDispatcher,
  WebPushDispatcher,
} from "./dispatchers/notification-dispatcher.factory";

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationQueueService,
    NotificationDispatcherFactory,
    DatabaseDispatcher,
    SocketDispatcher,
    WebPushDispatcher,
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
