import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { PricingModule } from './pricing/pricing.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { QuotesModule } from './quotes/quotes.module';
import { UsersModule } from './users/users.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { AuditModule } from './audit/audit.module';
import { OrdersModule } from './orders/orders.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ContractsModule } from './contracts/contracts.module';
import { DocumentsModule } from './documents/documents.module';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), '../../.env'), join(process.cwd(), '.env'), '.env'],
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    ProductsModule,
    PricingModule,
    QuotesModule,
    ApprovalsModule,
    OrdersModule,
    ContractsModule,
    DocumentsModule,
    IntegrationsModule,
    DashboardModule,
  ],
})
export class AppModule {}
