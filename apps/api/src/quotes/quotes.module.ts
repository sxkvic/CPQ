import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { ApprovalRulesService } from './approval-rules.service';
import { ConfigurationService } from './configuration.service';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [OrdersModule],
  controllers: [QuotesController],
  providers: [QuotesService, ApprovalRulesService, ConfigurationService],
})
export class QuotesModule {}
