import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from '../common/pagination.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomersService } from './customers.service';

@UseGuards(AuthGuard('jwt'))
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.customersService.list(query);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.customersService.detail(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  disable(@Param('id') id: string) {
    return this.customersService.disable(id);
  }
}
