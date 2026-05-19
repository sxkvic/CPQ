import { Injectable } from '@nestjs/common';
import { ApprovalStatus, ContractStatus, IntegrationEventStatus, QuoteStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [
      draftQuotes,
      pendingApprovals,
      acceptedQuotes,
      convertedQuotes,
      createdOrders,
      confirmedOrders,
      acceptedAmount,
      convertedAmount,
      activeContracts,
      activeSubscriptions,
      renewalDueSubscriptions,
      failedIntegrationEvents,
      recentQuotes,
      recentOrders,
      recentContracts,
      renewalPipeline,
    ] = await Promise.all([
      this.prisma.quote.count({ where: { status: QuoteStatus.draft } }),
      this.prisma.quoteApproval.count({ where: { status: ApprovalStatus.pending } }),
      this.prisma.quote.count({ where: { status: QuoteStatus.accepted } }),
      this.prisma.quote.count({ where: { status: QuoteStatus.converted } }),
      this.prisma.order.count({ where: { status: 'created' } }),
      this.prisma.order.count({ where: { status: 'confirmed' } }),
      this.prisma.quote.aggregate({
        where: { status: { in: [QuoteStatus.accepted, QuoteStatus.converted] } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: { status: { in: ['created', 'confirmed'] } },
        _sum: { totalAmount: true },
      }),
      this.prisma.contract.count({ where: { status: ContractStatus.active } }),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.active } }),
      this.prisma.subscription.count({
        where: {
          status: SubscriptionStatus.active,
          nextBillingAt: { lte: this.addDays(new Date(), 45) },
        },
      }),
      this.prisma.integrationEvent.count({ where: { status: IntegrationEventStatus.failed } }),
      this.prisma.quote.findMany({
        include: { customer: true },
        take: 6,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.order.findMany({
        include: { customer: true, quote: true },
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contract.findMany({
        include: { customer: true, quote: true, order: true },
        take: 6,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.subscription.findMany({
        where: { status: SubscriptionStatus.active },
        include: { customer: true, product: true, contract: true },
        take: 6,
        orderBy: { nextBillingAt: 'asc' },
      }),
    ]);

    return {
      cards: {
        draftQuotes,
        pendingApprovals,
        acceptedQuotes,
        convertedQuotes,
        createdOrders,
        confirmedOrders,
        activeContracts,
        activeSubscriptions,
        renewalDueSubscriptions,
        failedIntegrationEvents,
        acceptedAmount: acceptedAmount._sum.totalAmount ?? 0,
        orderAmount: convertedAmount._sum.totalAmount ?? 0,
      },
      quoteStatus: await this.groupQuotesByStatus(),
      orderStatus: await this.groupOrdersByStatus(),
      contractStatus: await this.groupContractsByStatus(),
      subscriptionStatus: await this.groupSubscriptionsByStatus(),
      recentQuotes,
      recentOrders,
      recentContracts,
      renewalPipeline,
    };
  }

  private async groupQuotesByStatus() {
    const rows = await this.prisma.quote.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    return rows.map((row) => ({ status: row.status, count: row._count.status }));
  }

  private async groupOrdersByStatus() {
    const rows = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    return rows.map((row) => ({ status: row.status, count: row._count.status }));
  }

  private async groupContractsByStatus() {
    const rows = await this.prisma.contract.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    return rows.map((row) => ({ status: row.status, count: row._count.status }));
  }

  private async groupSubscriptionsByStatus() {
    const rows = await this.prisma.subscription.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    return rows.map((row) => ({ status: row.status, count: row._count.status }));
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }
}
