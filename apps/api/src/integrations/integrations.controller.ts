import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaginationDto } from '../common/pagination.dto';
import { CreateIntegrationEndpointDto } from './dto/create-integration-endpoint.dto';
import { CreateIntegrationEventDto } from './dto/create-integration-event.dto';
import { IntegrationsService } from './integrations.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('endpoints')
  endpoints(@Query() query: PaginationDto) {
    return this.integrationsService.listEndpoints(query);
  }

  @Post('endpoints')
  @Roles('admin')
  createEndpoint(@Body() dto: CreateIntegrationEndpointDto) {
    return this.integrationsService.createEndpoint(dto);
  }

  @Get('events')
  events(@Query() query: PaginationDto) {
    return this.integrationsService.listEvents(query);
  }

  @Post('events')
  @Roles('admin', 'sales_manager')
  createEvent(@Body() dto: CreateIntegrationEventDto) {
    return this.integrationsService.createEvent(dto);
  }

  @Post('events/:id/mark-sent')
  @Roles('admin')
  markSent(@Param('id') id: string) {
    return this.integrationsService.markSent(id);
  }

  @Post('events/:id/mark-failed')
  @Roles('admin')
  markFailed(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.integrationsService.markFailed(id, body?.reason);
  }
}
