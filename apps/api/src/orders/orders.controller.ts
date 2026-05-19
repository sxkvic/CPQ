import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from '../common/pagination.dto';
import { OrdersService } from './orders.service';

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.ordersService.list(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.ordersService.detail(id);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.ordersService.confirm(id);
  }
}
