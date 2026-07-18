import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { NotificationsGateway } from "../notifications.gateway";
import * as webpush from "web-push";

export interface NotificationPayload {
  message: string;
  type: string;
  module: string;
  whatsappSent: boolean;
  whatsappMessageDetails?: string;
}

export interface NotificationDispatcher {
  dispatch(tenantId: string, payload: NotificationPayload): Promise<any>;
}

// 1. Database Dispatcher
@Injectable()
export class DatabaseDispatcher implements NotificationDispatcher {
  constructor(private readonly prisma: PrismaService) {}

  async dispatch(tenantId: string, payload: NotificationPayload): Promise<any> {
    return this.prisma.notification.create({
      data: {
        message: payload.message,
        tenantId,
        type: payload.type,
        module: payload.module,
        whatsappSent: payload.whatsappSent,
        whatsappMessageDetails: payload.whatsappMessageDetails,
      },
    });
  }
}

// 2. Socket.IO Dispatcher
@Injectable()
export class SocketDispatcher implements NotificationDispatcher {
  constructor(private readonly gateway: NotificationsGateway) {}

  async dispatch(tenantId: string, payload: NotificationPayload): Promise<void> {
    // Broadcast live update event
    this.gateway.sendToTenant(tenantId, "notification", {
      message: payload.message,
      type: payload.type,
      module: payload.module,
      timestamp: new Date().toISOString(),
    });
  }
}

// 3. Browser Push (Web Push) Dispatcher
@Injectable()
export class WebPushDispatcher implements NotificationDispatcher {
  private readonly logger = new Logger(WebPushDispatcher.name);

  constructor(private readonly prisma: PrismaService) {
    // Initialize VAPID
    const publicKey = process.env.VAPID_PUBLIC_KEY || "";
    const privateKey = process.env.VAPID_PRIVATE_KEY || "";
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@ricemill.com";

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    } else {
      this.logger.warn("VAPID keys not configured. Web Push notifications will not trigger.");
    }
  }

  async dispatch(tenantId: string, payload: NotificationPayload): Promise<void> {
    try {
      // Find all users belonging to this tenant
      const users = await this.prisma.user.findMany({
        where: { tenantId },
        select: { id: true },
      });

      if (!users.length) return;

      const userIds = users.map((u) => u.id);

      // Find push subscriptions for these users
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { userId: { in: userIds } },
      });

      if (!subscriptions.length) return;

      const pushPayload = JSON.stringify({
        title: `${payload.module} Notification`,
        body: payload.message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: {
          url: "/notifications",
        },
      });

      const promises = subscriptions.map((sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        return webpush.sendNotification(pushSubscription, pushPayload).catch((err) => {
          this.logger.error(`Error sending Web Push to subscription endpoint ${sub.endpoint}:`, err);
          // If subscription has expired or is no longer valid (e.g. 404 or 410 Gone), remove it
          if (err.statusCode === 404 || err.statusCode === 410) {
            return this.prisma.pushSubscription.delete({
              where: { id: sub.id },
            });
          }
        });
      });

      await Promise.all(promises);
    } catch (err) {
      this.logger.error("Web Push dispatcher failed:", err);
    }
  }
}

// 4. Factory Class
@Injectable()
export class NotificationDispatcherFactory {
  constructor(
    private readonly dbDispatcher: DatabaseDispatcher,
    private readonly socketDispatcher: SocketDispatcher,
    private readonly webPushDispatcher: WebPushDispatcher
  ) {}

  getDispatcher(channel: "DATABASE" | "SOCKET" | "WEB_PUSH"): NotificationDispatcher {
    switch (channel) {
      case "DATABASE":
        return this.dbDispatcher;
      case "SOCKET":
        return this.socketDispatcher;
      case "WEB_PUSH":
        return this.webPushDispatcher;
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }
}
