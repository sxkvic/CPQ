import { Module } from '@nestjs/common';
import { ContractsModule } from '../contracts/contracts.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [ContractsModule, IntegrationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
