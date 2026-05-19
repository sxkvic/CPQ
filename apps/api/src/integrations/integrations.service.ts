import { Injectable } from '@nestjs/common';
import { IntegrationEventStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PaginationDto } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIntegrationEndpointDto } from './dto/create-integration-endpoint.dto';
import { CreateIntegrationEventDto } from './dto/create-integration-event.dto';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listEndpoints(query: PaginationDto) {
    const where = query.keyword
      ? {
          OR: [
            { code: { contains: query.keyword, mode: 'insensitive' as const } },
            { name: { contains: query.keyword, mode: 'insensitive' as const } },
            { targetSystem: { contains: query.keyword, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.integrationEndpoint.findMany({
        where,
        include: { events: { take: 5, orderBy: { createdAt: 'desc' } } },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.integrationEndpoint.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async createEndpoint(dto: CreateIntegrationEndpointDto) {
    const endpoint = await this.prisma.integrationEndpoint.create({
      data: {
        code: dto.code,
        name: dto.name,
        targetSystem: dto.targetSystem,
        eventType: dto.eventType,
        url: dto.url,
        authType: dto.authType ?? 'none',
      },
    });
    await this.audit.write({
      action: 'integration_endpoint.create',
      resourceType: 'integration_endpoint',
      resourceId: endpoint.id,
      after: endpoint,
    });
    return endpoint;
  }

  async listEvents(query: PaginationDto) {
    const where = query.keyword
      ? {
          OR: [
            { resourceType: { contains: query.keyword, mode: 'insensitive' as const } },
            { eventType: { contains: query.keyword, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.integrationEvent.findMany({
        where,
        include: { endpoint: true, quote: true, order: true, contract: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.integrationEvent.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async createEvent(dto: CreateIntegrationEventDto) {
    const event = await this.prisma.integrationEvent.create({
      data: {
        endpointId: dto.endpointId,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        quoteId: dto.resourceType === 'quote' ? dto.resourceId : undefined,
        orderId: dto.resourceType === 'order' ? dto.resourceId : undefined,
        contractId: dto.resourceType === 'contract' ? dto.resourceId : undefined,
        eventType: dto.eventType,
        payloadJson: dto.payloadJson as Prisma.InputJsonValue,
      },
      include: { endpoint: true },
    });
    await this.audit.write({
      action: 'integration_event.create',
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      after: this.toJsonSafe(event),
    });
    return event;
  }

  async markSent(id: string) {
    const event = await this.prisma.integrationEvent.update({
      where: { id },
      data: {
        status: IntegrationEventStatus.sent,
        responseJson: { status: 'mock_sent', sentAt: new Date().toISOString() },
        endpoint: { update: { lastSyncAt: new Date() } },
      },
      include: { endpoint: true },
    });
    await this.audit.write({
      action: 'integration_event.mark_sent',
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      after: this.toJsonSafe(event),
    });
    return event;
  }

  async markFailed(id: string, reason?: string) {
    const event = await this.prisma.integrationEvent.update({
      where: { id },
      data: {
        status: IntegrationEventStatus.failed,
        retryCount: { increment: 1 },
        nextRetryAt: this.addMinutes(new Date(), 30),
        responseJson: { reason: reason ?? 'manual failure', failedAt: new Date().toISOString() },
      },
      include: { endpoint: true },
    });
    await this.audit.write({
      action: 'integration_event.mark_failed',
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      after: this.toJsonSafe(event),
    });
    return event;
  }

  private addMinutes(date: Date, minutes: number) {
    const next = new Date(date);
    next.setMinutes(next.getMinutes() + minutes);
    return next;
  }

  private toJsonSafe(value: unknown) {
    return JSON.parse(JSON.stringify(value, (_key, current) => (typeof current === 'bigint' ? current.toString() : current)));
  }
}
