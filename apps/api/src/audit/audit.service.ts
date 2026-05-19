import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

type AuditInput = {
  action: string;
  resourceType: string;
  resourceId?: string;
  before?: unknown;
  after?: unknown;
  actorId?: string;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  write(input: AuditInput) {
    return this.prisma.auditLog.create({
      data: {
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        actorId: input.actorId,
        beforeJson: input.before as Prisma.InputJsonValue | undefined,
        afterJson: input.after as Prisma.InputJsonValue | undefined,
      },
    });
  }

  list(resourceType: string, resourceId: string) {
    return this.prisma.auditLog.findMany({
      where: { resourceType, resourceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async search(query: PaginationDto & { resourceType?: string; resourceId?: string }) {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.resourceType ? { resourceType: query.resourceType } : {}),
      ...(query.resourceId ? { resourceId: query.resourceId } : {}),
      ...(query.keyword
        ? {
            OR: [
              { action: { contains: query.keyword, mode: 'insensitive' } },
              { resourceType: { contains: query.keyword, mode: 'insensitive' } },
              { resourceId: { contains: query.keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }
}
