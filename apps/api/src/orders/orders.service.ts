import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { QuoteStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PaginationDto } from '../common/pagination.dto';
import { ContractsService } from '../contracts/contracts.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Optional() private readonly contracts?: ContractsService,
    @Optional() private readonly integrations?: IntegrationsService,
  ) {}

  async list(query: PaginationDto) {
    const where = query.keyword
      ? { orderNo: { contains: query.keyword, mode: 'insensitive' as const } }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { customer: true, quote: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  detail(id: string) {
    return this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: { customer: true, quote: { include: { items: true } } },
    });
  }

  async convertFromQuote(quoteId: string) {
    const quote = await this.prisma.quote.findUniqueOrThrow({
      where: { id: quoteId },
      include: { order: true, customer: true, items: true },
    });
    if (quote.order) {
      return quote.order;
    }
    if (quote.status !== QuoteStatus.accepted) {
      throw new BadRequestException('只有已接受报价可以转订单');
    }

    const orderNo = await this.nextOrderNo();
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNo,
          quoteId: quote.id,
          customerId: quote.customerId,
          totalAmount: quote.totalAmount,
        },
        include: { customer: true, quote: true },
      });
      await tx.quote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.converted },
      });
      return created;
    });
    await this.audit.write({
      action: 'quote.convert_to_order',
      resourceType: 'quote',
      resourceId: quoteId,
      after: order,
    });
    return order;
  }

  async confirm(id: string) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: 'confirmed' },
      include: { customer: true, quote: true },
    });
    await this.audit.write({
      action: 'order.confirm',
      resourceType: 'order',
      resourceId: id,
      after: order,
    });
    if (this.contracts) {
      await this.contracts.createFromOrder(id);
    }
    if (this.integrations) {
      await this.integrations.createEvent({
        resourceType: 'order',
        resourceId: id,
        eventType: 'order.confirmed',
        payloadJson: {
          orderNo: order.orderNo,
          customerId: order.customerId,
          quoteId: order.quoteId,
          totalAmount: order.totalAmount.toString(),
        },
      });
    }
    return order;
  }

  private async nextOrderNo() {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate(),
    ).padStart(2, '0')}`;
    const count = await this.prisma.order.count({
      where: { orderNo: { startsWith: `O-${date}` } },
    });
    return `O-${date}-${String(count + 1).padStart(4, '0')}`;
  }
}
