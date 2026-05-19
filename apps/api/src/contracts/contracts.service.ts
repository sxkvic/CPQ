import { BadRequestException, Injectable } from '@nestjs/common';
import { ContractStatus, Prisma, SubscriptionStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PaginationDto } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: PaginationDto) {
    const where = query.keyword
      ? { contractNo: { contains: query.keyword, mode: 'insensitive' as const } }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        include: { customer: true, quote: true, order: true, subscriptions: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contract.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  detail(id: string) {
    return this.prisma.contract.findUniqueOrThrow({
      where: { id },
      include: {
        customer: true,
        quote: { include: { items: true } },
        order: true,
        subscriptions: { include: { product: true } },
      },
    });
  }

  async create(dto: CreateContractDto) {
    const contractNo = await this.nextContractNo();
    const source = await this.resolveContractSource(dto);
    const contract = await this.prisma.contract.create({
      data: {
        contractNo,
        quoteId: dto.quoteId,
        orderId: dto.orderId,
        customerId: dto.customerId,
        totalAmount: source.totalAmount,
        currency: source.currency,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        paymentTerms: dto.paymentTerms ?? source.paymentTerms,
        deliveryTerms: dto.deliveryTerms ?? source.deliveryTerms,
        renewalNoticeDays: dto.renewalNoticeDays ?? 30,
      },
      include: { customer: true, quote: true, order: true },
    });
    await this.audit.write({
      action: 'contract.create',
      resourceType: 'contract',
      resourceId: contract.id,
      after: this.toJsonSafe(contract),
    });
    return contract;
  }

  async createFromOrder(orderId: string) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { quote: true },
    });
    const existing = await this.prisma.contract.findFirst({ where: { orderId } });
    if (existing) return existing;
    return this.create({
      orderId,
      quoteId: order.quoteId,
      customerId: order.customerId,
      paymentTerms: order.quote.paymentTerms ?? undefined,
      deliveryTerms: order.quote.deliveryTerms ?? undefined,
    });
  }

  async sign(id: string) {
    const contract = await this.prisma.contract.update({
      where: { id },
      data: { status: ContractStatus.active, signedAt: new Date() },
      include: { customer: true, order: true, quote: { include: { items: true } } },
    });
    if (contract.quote) {
      await this.createSubscriptionsFromQuote(contract.id, contract.quote.items, contract);
    }
    await this.audit.write({
      action: 'contract.sign',
      resourceType: 'contract',
      resourceId: id,
      after: this.toJsonSafe(contract),
    });
    return this.detail(id);
  }

  async terminate(id: string) {
    const contract = await this.prisma.contract.update({
      where: { id },
      data: { status: ContractStatus.terminated },
      include: { subscriptions: true },
    });
    await this.prisma.subscription.updateMany({
      where: { contractId: id, status: { in: [SubscriptionStatus.pending, SubscriptionStatus.active] } },
      data: { status: SubscriptionStatus.canceled },
    });
    await this.audit.write({
      action: 'contract.terminate',
      resourceType: 'contract',
      resourceId: id,
      after: this.toJsonSafe(contract),
    });
    return this.detail(id);
  }

  async subscriptions(query: PaginationDto) {
    const where = query.keyword
      ? { subscriptionNo: { contains: query.keyword, mode: 'insensitive' as const } }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        include: { customer: true, product: true, contract: true, order: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async renewalSummary() {
    const now = new Date();
    const in30Days = this.addDays(now, 30);
    const in90Days = this.addDays(now, 90);
    const [overdue, dueIn30Days, dueIn90Days, autoRenew, missingBillingDate, amountDueIn90Days] =
      await Promise.all([
        this.prisma.subscription.count({
          where: { status: SubscriptionStatus.active, nextBillingAt: { lt: now } },
        }),
        this.prisma.subscription.count({
          where: { status: SubscriptionStatus.active, nextBillingAt: { gte: now, lte: in30Days } },
        }),
        this.prisma.subscription.count({
          where: { status: SubscriptionStatus.active, nextBillingAt: { gte: now, lte: in90Days } },
        }),
        this.prisma.subscription.count({
          where: { status: SubscriptionStatus.active, autoRenew: true },
        }),
        this.prisma.subscription.count({
          where: { status: SubscriptionStatus.active, nextBillingAt: null },
        }),
        this.prisma.subscription.findMany({
          where: { status: SubscriptionStatus.active, nextBillingAt: { gte: now, lte: in90Days } },
          select: { quantity: true, unitPrice: true },
        }),
      ]);
    return {
      overdue,
      dueIn30Days,
      dueIn90Days,
      autoRenew,
      missingBillingDate,
      amountDueIn90Days: amountDueIn90Days
        .reduce((sum, item) => sum.add(item.quantity.mul(item.unitPrice)), new Prisma.Decimal(0))
        .toString(),
    };
  }

  async createSubscription(dto: CreateSubscriptionDto) {
    const subscription = await this.prisma.subscription.create({
      data: {
        subscriptionNo: await this.nextSubscriptionNo(),
        contractId: dto.contractId,
        orderId: dto.orderId,
        customerId: dto.customerId,
        productId: dto.productId,
        quoteItemId: dto.quoteItemId,
        billingCycle: dto.billingCycle ?? 'monthly',
        quantity: new Prisma.Decimal(dto.quantity ?? 1),
        unitPrice: new Prisma.Decimal(dto.unitPrice ?? 0),
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        nextBillingAt: dto.nextBillingAt ? new Date(dto.nextBillingAt) : undefined,
        autoRenew: dto.autoRenew ?? false,
        renewalTermMonths: dto.renewalTermMonths ?? 12,
      },
      include: { customer: true, product: true, contract: true },
    });
    await this.audit.write({
      action: 'subscription.create',
      resourceType: 'subscription',
      resourceId: subscription.id,
      after: this.toJsonSafe(subscription),
    });
    return subscription;
  }

  async activateSubscription(id: string) {
    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.active },
      include: { customer: true, product: true },
    });
    await this.audit.write({
      action: 'subscription.activate',
      resourceType: 'subscription',
      resourceId: id,
      after: this.toJsonSafe(subscription),
    });
    return subscription;
  }

  private async resolveContractSource(dto: CreateContractDto) {
    if (dto.orderId) {
      const order = await this.prisma.order.findUniqueOrThrow({
        where: { id: dto.orderId },
        include: { quote: true },
      });
      if (order.customerId !== dto.customerId) {
        throw new BadRequestException('订单客户与合同客户不一致');
      }
      return {
        totalAmount: order.totalAmount,
        currency: order.quote.currency,
        paymentTerms: order.quote.paymentTerms ?? undefined,
        deliveryTerms: order.quote.deliveryTerms ?? undefined,
      };
    }
    if (dto.quoteId) {
      const quote = await this.prisma.quote.findUniqueOrThrow({ where: { id: dto.quoteId } });
      if (quote.customerId !== dto.customerId) {
        throw new BadRequestException('报价客户与合同客户不一致');
      }
      return {
        totalAmount: quote.totalAmount,
        currency: quote.currency,
        paymentTerms: quote.paymentTerms ?? undefined,
        deliveryTerms: quote.deliveryTerms ?? undefined,
      };
    }
    return {
      totalAmount: new Prisma.Decimal(0),
      currency: 'CNY',
      paymentTerms: undefined,
      deliveryTerms: undefined,
    };
  }

  private async createSubscriptionsFromQuote(
    contractId: string,
    items: Array<{ id: string; productId: string; quoteId: string; quantity: Prisma.Decimal; unitPrice: Prisma.Decimal }>,
    contract: { orderId: string | null; customerId: string; startDate: Date | null; endDate: Date | null },
  ) {
    const startDate = contract.startDate ?? new Date();
    for (const item of items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.productType !== 'software') continue;
      const existing = await this.prisma.subscription.findFirst({ where: { contractId, quoteItemId: item.id } });
      if (existing) continue;
      await this.prisma.subscription.create({
        data: {
          subscriptionNo: await this.nextSubscriptionNo(),
          contractId,
          orderId: contract.orderId ?? undefined,
          customerId: contract.customerId,
          productId: item.productId,
          quoteItemId: item.id,
          status: SubscriptionStatus.active,
          billingCycle: 'annual',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          startDate,
          endDate: contract.endDate,
          nextBillingAt: this.addMonths(startDate, 12),
          autoRenew: true,
          renewalTermMonths: 12,
        },
      });
    }
  }

  private addMonths(date: Date, months: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private async nextContractNo() {
    return this.nextNo('C', 'contract', 'contractNo');
  }

  private async nextSubscriptionNo() {
    return this.nextNo('S', 'subscription', 'subscriptionNo');
  }

  private async nextNo(prefix: string, model: 'contract' | 'subscription', field: 'contractNo' | 'subscriptionNo') {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const startsWith = `${prefix}-${date}`;
    const count =
      model === 'contract'
        ? await this.prisma.contract.count({ where: { [field]: { startsWith } } })
        : await this.prisma.subscription.count({ where: { [field]: { startsWith } } });
    return `${startsWith}-${String(count + 1).padStart(4, '0')}`;
  }

  private toJsonSafe(value: unknown) {
    return JSON.parse(JSON.stringify(value, (_key, current) => (typeof current === 'bigint' ? current.toString() : current)));
  }
}
