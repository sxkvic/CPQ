import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from '../common/pagination.dto';
import { AuditService } from './audit.service';

@UseGuards(AuthGuard('jwt'))
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query() query: PaginationDto & { resourceType?: string; resourceId?: string }) {
    return this.auditService.search(query);
  }

  @Get(':resourceType/:resourceId')
  byResource(@Param('resourceType') resourceType: string, @Param('resourceId') resourceId: string) {
    return this.auditService.list(resourceType, resourceId);
  }
}
