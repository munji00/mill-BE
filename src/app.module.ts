import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantModule } from './modules/tenants/tenants.module';
import { DatabaseModule } from './database/database.module';
import { PurchaseModule } from "./modules/purchase/purchase.module";
import { SalesModule } from "./modules/sales/sales.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { LabourModule } from "./modules/labour/labour.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    TenantModule,
    DatabaseModule,
    PurchaseModule,
    SalesModule,
    ExpensesModule,
    LabourModule,
    InventoryModule,
    NotificationsModule,
    DashboardModule,
  ],
})
export class AppModule {}