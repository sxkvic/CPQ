import { Module } from '@nestjs/common';
import { ConfigurationRulesController } from './configuration-rules.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController, ConfigurationRulesController],
  providers: [ProductsService],
})
export class ProductsModule {}
