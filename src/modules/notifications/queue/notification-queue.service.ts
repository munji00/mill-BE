import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Subject, Subscription } from "rxjs";
import { concatMap } from "rxjs/operators";
import { NotificationDispatcherFactory, NotificationPayload } from "../dispatchers/notification-dispatcher.factory";

interface NotificationJob {
  tenantId: string;
  payload: NotificationPayload;
}

@Injectable()
export class NotificationQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationQueueService.name);
  
  // Job Queue using RxJS Subject
  private readonly jobQueue$ = new Subject<NotificationJob>();
  private queueSubscription: Subscription;

  constructor(private readonly factory: NotificationDispatcherFactory) {}

  onModuleInit() {
    // Process queue jobs sequentially (FIFO) to avoid race conditions and database locks
    this.queueSubscription = this.jobQueue$
      .pipe(
        concatMap(async (job) => {
          try {
            await this.processJob(job);
          } catch (err) {
            this.logger.error(`Error processing notification job for tenant ${job.tenantId}:`, err);
          }
        })
      )
      .subscribe();
      
    this.logger.log("Notification queue worker initialized");
  }

  onModuleDestroy() {
    if (this.queueSubscription) {
      this.queueSubscription.unsubscribe();
    }
  }

  // Push new notification to background worker queue
  addJob(tenantId: string, payload: NotificationPayload) {
    this.jobQueue$.next({ tenantId, payload });
  }

  private async processJob(job: NotificationJob): Promise<void> {
    const { tenantId, payload } = job;
    this.logger.log(`Processing background notification job for tenant ${tenantId} [${payload.module}]`);

    // 1. Dispatch to Database channel (persists the alert)
    const dbDispatcher = this.factory.getDispatcher("DATABASE");
    const createdNotification = await dbDispatcher.dispatch(tenantId, payload);

    // 2. Dispatch to Socket.IO channel (real-time active user socket update)
    const socketDispatcher = this.factory.getDispatcher("SOCKET");
    await socketDispatcher.dispatch(tenantId, payload);

    // 3. Dispatch to Web Push channel (browser push alerts for background clients)
    const webPushDispatcher = this.factory.getDispatcher("WEB_PUSH");
    await webPushDispatcher.dispatch(tenantId, payload);

    this.logger.log(`Completed notification dispatch for tenant ${tenantId}`);
  }
}
