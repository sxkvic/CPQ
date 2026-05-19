import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { FileBase64Dto } from '../common/file-base64.dto';
import { PaginationDto } from '../common/pagination.dto';
import { CreatePriceBookItemDto } from './dto/create-price-book-item.dto';
import { CreatePriceBookDto } from './dto/create-price-book.dto';
import { PricingService } from './pricing.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('price-books')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.pricingService.list(query);
  }

  @Post()
  @Roles('pricing_manager')
  create(@Body() dto: CreatePriceBookDto) {
    return this.pricingService.create(dto);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.pricingService.detail(id);
  }

  @Post(':id/items')
  @Roles('pricing_manager')
  addItem(@Param('id') id: string, @Body() dto: CreatePriceBookItemDto) {
    return this.pricingService.addItem(id, dto);
  }

  @Get(':id/items/export/excel')
  exportItems(@Param('id') id: string) {
    return this.pricingService.exportItems(id);
  }

  @Post(':id/items/import/excel')
  @Roles('pricing_manager')
  importItems(@Param('id') id: string, @Body() dto: FileBase64Dto) {
    return this.pricingService.importItems(id, dto.fileBase64);
  }
}
