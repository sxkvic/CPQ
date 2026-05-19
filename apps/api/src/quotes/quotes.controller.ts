import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from '../common/pagination.dto';
import { AddQuoteItemDto } from './dto/add-quote-item.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteItemDto } from './dto/update-quote-item.dto';
import { ValidateConfigurationDto } from './dto/validate-configuration.dto';
import { QuotesService } from './quotes.service';

@UseGuards(AuthGuard('jwt'))
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.quotesService.list(query);
  }

  @Post()
  create(@Body() dto: CreateQuoteDto) {
    return this.quotesService.create(dto);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.quotesService.detail(id);
  }

  @Get(':id/audit-logs')
  auditLogs(@Param('id') id: string) {
    return this.quotesService.auditLogs(id);
  }

  @Post(':id/new-version')
  newVersion(@Param('id') id: string) {
    return this.quotesService.newVersion(id);
  }

  @Post(':id/convert-to-order')
  convertToOrder(@Param('id') id: string) {
    return this.quotesService.convertToOrder(id);
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() dto: AddQuoteItemDto) {
    return this.quotesService.addItem(id, dto);
  }

  @Post('configuration/validate')
  validateConfiguration(@Body() dto: ValidateConfigurationDto) {
    return this.quotesService.validateConfiguration(dto);
  }

  @Put('items/:itemId')
  updateItem(@Param('itemId') itemId: string, @Body() dto: UpdateQuoteItemDto) {
    return this.quotesService.updateItem(itemId, dto);
  }

  @Delete('items/:itemId')
  removeItem(@Param('itemId') itemId: string) {
    return this.quotesService.removeItem(itemId);
  }

  @Post(':id/calculate')
  calculate(@Param('id') id: string) {
    return this.quotesService.calculate(id);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string) {
    return this.quotesService.submit(id);
  }

  @Post(':id/mark-sent')
  markSent(@Param('id') id: string) {
    return this.quotesService.markSent(id);
  }

  @Post(':id/mark-accepted')
  markAccepted(@Param('id') id: string) {
    return this.quotesService.markAccepted(id);
  }

  @Post(':id/mark-rejected')
  markRejected(@Param('id') id: string) {
    return this.quotesService.markRejected(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.quotesService.cancel(id);
  }

  @Get(':id/export/html')
  exportHtml(@Param('id') id: string) {
    return this.quotesService.exportHtml(id);
  }
}
