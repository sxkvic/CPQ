import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaginationDto } from '../common/pagination.dto';
import { CreateConfigurationRuleDto } from './dto/create-configuration-rule.dto';
import { ProductsService } from './products.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('configuration-rules')
export class ConfigurationRulesController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.productsService.listRules(query);
  }

  @Post()
  @Roles('product_manager')
  create(@Body() dto: CreateConfigurationRuleDto) {
    return this.productsService.createRule(dto);
  }

  @Put(':id')
  @Roles('product_manager')
  update(@Param('id') id: string, @Body() dto: CreateConfigurationRuleDto) {
    return this.productsService.updateRule(id, dto);
  }

  @Post(':id/toggle')
  @Roles('product_manager')
  toggle(@Param('id') id: string) {
    return this.productsService.toggleRule(id);
  }
}
