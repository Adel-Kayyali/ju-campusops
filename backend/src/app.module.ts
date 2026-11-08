import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommonModule } from './common/common.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RolesGuard } from './common/guards/roles.guard';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { HealthModule } from './modules/health/health.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { LocationsModule } from './modules/locations/locations.module';
import { LockersModule } from './modules/lockers/lockers.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ServiceRequestsModule } from './modules/service-requests/service-requests.module';
import { SlaModule } from './modules/sla/sla.module';
import { StorageModule } from './modules/storage/storage.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { TechniciansModule } from './modules/technicians/technicians.module';
import { UsersModule } from './modules/users/users.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';

/**
 * Root module. Infrastructure modules first (config, database, cross-cutting services),
 * then one module per business feature.
 */
@Module({
  imports: [
    // infrastructure
    AppConfigModule,
    DatabaseModule,
    CommonModule,
    EventEmitterModule.forRoot(),
    AuditModule,
    NotificationsModule,
    StorageModule,
    HealthModule,
    // features
    AuthModule,
    UsersModule,
    LocationsModule,
    SlaModule,
    LockersModule,
    AssetsModule,
    ServiceRequestsModule,
    TechniciansModule,
    TeachersModule,
    InventoryModule,
    WorkOrdersModule,
    MaintenanceModule,
    ReportsModule,
    JobsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
