import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaginationDto } from '../common/pagination.dto';
import { ApprovalActionDto } from './dto/approval-action.dto';
import { ApprovalsService } from './approvals.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('tasks')
  tasks(@Query() query: PaginationDto) {
    return this.approvalsService.tasks(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.approvalsService.detail(id);
  }

  @Post(':id/approve')
  @Roles('sales_manager', 'finance', 'executive')
  approve(@Param('id') id: string, @Body() dto: ApprovalActionDto) {
    return this.approvalsService.approve(id, dto.comment);
  }

  @Post(':id/reject')
  @Roles('sales_manager', 'finance', 'executive')
  reject(@Param('id') id: string, @Body() dto: ApprovalActionDto) {
    return this.approvalsService.reject(id, dto.comment);
  }
}
