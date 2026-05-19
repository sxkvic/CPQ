import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from '../common/pagination.dto';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('contracts')
  list(@Query() query: PaginationDto) {
    return this.contractsService.list(query);
  }

  @Post('contracts')
  create(@Body() dto: CreateContractDto) {
    return this.contractsService.create(dto);
  }

  @Get('contracts/:id')
  detail(@Param('id') id: string) {
    return this.contractsService.detail(id);
  }

  @Post('contracts/from-order/:orderId')
  createFromOrder(@Param('orderId') orderId: string) {
    return this.contractsService.createFromOrder(orderId);
  }

  @Post('contracts/:id/sign')
  sign(@Param('id') id: string) {
    return this.contractsService.sign(id);
  }

  @Post('contracts/:id/terminate')
  terminate(@Param('id') id: string) {
    return this.contractsService.terminate(id);
  }

  @Get('subscriptions')
  subscriptions(@Query() query: PaginationDto) {
    return this.contractsService.subscriptions(query);
  }

  @Get('subscriptions/renewal-summary')
  renewalSummary() {
    return this.contractsService.renewalSummary();
  }

  @Post('subscriptions')
  createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.contractsService.createSubscription(dto);
  }

  @Post('subscriptions/:id/activate')
  activateSubscription(@Param('id') id: string) {
    return this.contractsService.activateSubscription(id);
  }
}
