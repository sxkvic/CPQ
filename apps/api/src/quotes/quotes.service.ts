import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, QuoteStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PaginationDto } from '../common/pagination.dto';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalRulesService } from './approval-rules.service';
import { ConfigurationService } from './configuration.service';
import { AddQuoteItemDto } from './dto/add-quote-item.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteItemDto } from './dto/update-quote-item.dto';
import { ValidateConfigurationDto } from './dto/validate-configuration.dto';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalRules: ApprovalRulesService,
    private readonly configuration: ConfigurationService,
    private readonly audit: AuditService,
    private readonly orders: OrdersService,
  ) {}

  async list(query: PaginationDto) {
    const where = query.keyword
      ? { quoteNo: { contains: query.keyword, mode: 'insensitive' as const } }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        include: { customer: true, owner: true, items: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.quote.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async create(dto: CreateQuoteDto) {
    const quoteNo = await this.nextQuoteNo();
    const quote = await this.prisma.quote.create({
      data: {
        quoteNo,
        customerId: dto.customerId,
        contactId: dto.contactId,
        opportunityId: dto.opportunityId,
        ownerId: dto.ownerId,
        priceBookId: dto.priceBookId,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        paymentTerms: dto.paymentTerms,
        deliveryTerms: dto.deliveryTerms,
        remarks: dto.remarks,
      },
      include: { customer: true, contact: true, items: true },
    });
    await this.writeAudit('quote.create', quote.id, undefined, quote);
    return quote;
  }

  detail(id: string) {
    return this.prisma.quote.findUniqueOrThrow({
      where: { id },
      include: {
        customer: true,
        contact: true,
        opportunity: true,
        priceBook: true,
        items: { orderBy: { lineNo: 'asc' }, include: { product: true } },
        approvals: { include: { logs: true } },
        versions: { orderBy: { version: 'desc' } },
      },
    });
  }

  auditLogs(quoteId: string) {
    return this.audit.list('quote', quoteId);
  }

  validateConfiguration(dto: ValidateConfigurationDto) {
    return this.configuration.validate(dto);
  }

  async addItem(quoteId: string, dto: AddQuoteItemDto) {
    const quote = await this.prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });
    this.ensureDraft(quote.status);

    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id: dto.productId },
      include: { priceBookItems: true },
    });
    const validation = await this.configuration.validate({
      productId: dto.productId,
      quantity: dto.quantity,
      customerId: quote.customerId,
      selectedOptions: dto.selectedOptions,
    });
    if (!validation.valid) {
      throw new BadRequestException(validation.messages.map((item) => item.message).join('; '));
    }

    const priceItem = quote.priceBookId
      ? product.priceBookItems.find((item) => item.priceBookId === quote.priceBookId)
      : undefined;
    const baseUnitPrice = new Prisma.Decimal(priceItem?.unitPrice ?? product.standardPrice);
    const baseCostPrice = new Prisma.Decimal(priceItem?.costPrice ?? product.standardCost ?? 0);
    const unitPrice = baseUnitPrice.add(validation.optionPriceDelta);
    const costPrice = baseCostPrice.add(validation.optionCostDelta);
    const quantity = new Prisma.Decimal(dto.quantity);
    const discountRate = new Prisma.Decimal(dto.discountRate ?? 0);
    const taxRate = new Prisma.Decimal(dto.taxRate ?? 0.13);
    const listAmount = unitPrice.mul(quantity);
    const discountAmount = listAmount.mul(discountRate);
    const netAmount = listAmount.sub(discountAmount);
    const taxAmount = netAmount.mul(taxRate);
    const totalAmount = netAmount.add(taxAmount);
    const lineNo = await this.nextLineNo(quoteId);

    await this.prisma.quoteItem.create({
      data: {
        quoteId,
        productId: product.id,
        lineNo,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
        quantity,
        unit: product.unit,
        unitPrice,
        costPrice,
        optionConfigJson: {
          selectedOptions: dto.selectedOptions ?? [],
          selectedSummary: validation.selectedSummary,
        } as unknown as Prisma.InputJsonValue,
        listAmount,
        discountRate,
        discountAmount,
        netAmount,
        taxRate,
        taxAmount,
        totalAmount,
      },
    });

    const calculated = await this.calculate(quoteId);
    await this.writeAudit('quote.item.add', quoteId, undefined, calculated);
    return calculated;
  }

  async updateItem(itemId: string, dto: UpdateQuoteItemDto) {
    const item = await this.prisma.quoteItem.findUniqueOrThrow({
      where: { id: itemId },
      include: { quote: true },
    });
    this.ensureDraft(item.quote.status);

    const quantity = new Prisma.Decimal(dto.quantity ?? item.quantity);
    const discountRate = new Prisma.Decimal(dto.discountRate ?? item.discountRate);
    const taxRate = new Prisma.Decimal(dto.taxRate ?? item.taxRate);
    const listAmount = item.unitPrice.mul(quantity);
    const discountAmount = listAmount.mul(discountRate);
    const netAmount = listAmount.sub(discountAmount);
    const taxAmount = netAmount.mul(taxRate);
    const totalAmount = netAmount.add(taxAmount);

    await this.prisma.quoteItem.update({
      where: { id: itemId },
      data: { quantity, discountRate, taxRate, listAmount, discountAmount, netAmount, taxAmount, totalAmount },
    });

    const calculated = await this.calculate(item.quoteId);
    await this.writeAudit('quote.item.update', item.quoteId, item, calculated);
    return calculated;
  }

  async removeItem(itemId: string) {
    const item = await this.prisma.quoteItem.findUniqueOrThrow({
      where: { id: itemId },
      include: { quote: true },
    });
    this.ensureDraft(item.quote.status);
    await this.prisma.quoteItem.delete({ where: { id: itemId } });
    const calculated = await this.calculate(item.quoteId);
    await this.writeAudit('quote.item.remove', item.quoteId, item, calculated);
    return calculated;
  }

  async calculate(quoteId: string) {
    const quote = await this.prisma.quote.findUniqueOrThrow({
      where: { id: quoteId },
      include: { items: true },
    });
    const subtotalAmount = quote.items.reduce((sum, item) => sum.add(item.netAmount), new Prisma.Decimal(0));
    const taxAmount = quote.items.reduce((sum, item) => sum.add(item.taxAmount), new Prisma.Decimal(0));
    const totalCost = quote.items.reduce(
      (sum, item) => sum.add(item.costPrice.mul(item.quantity)),
      new Prisma.Decimal(0),
    );
    const totalAmount = subtotalAmount.add(taxAmount).add(quote.serviceFee).add(quote.shippingFee);
    const grossProfit = totalAmount.sub(totalCost);
    const grossMarginRate = totalAmount.gt(0) ? grossProfit.div(totalAmount) : new Prisma.Decimal(0);
    const approvalReasons = await this.getApprovalReasons(quote.items, grossMarginRate, totalAmount);

    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: { subtotalAmount, taxAmount, totalAmount, totalCost, grossMarginRate },
      include: { customer: true, items: { orderBy: { lineNo: 'asc' } } },
    });
    return { ...updated, approvalRequired: approvalReasons.length > 0, approvalReasons };
  }

  async submit(quoteId: string) {
    const calculated = await this.calculate(quoteId);
    this.ensureDraft(calculated.status);
    const approvalReasons = calculated.approvalReasons.length
      ? calculated.approvalReasons
      : ['标准报价提交审批'];

    await this.createVersionSnapshot(quoteId, '提交审批快照');
    await this.prisma.quoteApproval.create({ data: { quoteId, triggerReasonsJson: approvalReasons } });
    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.pending_approval, submittedAt: new Date() },
      include: { customer: true, items: true, approvals: true },
    });
    await this.writeAudit('quote.submit', quoteId, calculated, updated);
    return updated;
  }

  async markSent(quoteId: string) {
    const quote = await this.prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });
    if (quote.status !== QuoteStatus.approved) throw new BadRequestException('只有已批准报价可以标记为已发送');
    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.sent, sentAt: new Date() },
      include: { customer: true, items: true },
    });
    await this.writeAudit('quote.mark_sent', quoteId, quote, updated);
    return updated;
  }

  async markAccepted(quoteId: string) {
    const quote = await this.prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });
    if (quote.status !== QuoteStatus.sent && quote.status !== QuoteStatus.approved) {
      throw new BadRequestException('只有已批准或已发送报价可以标记为已接受');
    }
    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.accepted },
      include: { customer: true, items: true },
    });
    await this.writeAudit('quote.mark_accepted', quoteId, quote, updated);
    return updated;
  }

  async markRejected(quoteId: string) {
    const quote = await this.prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });
    if (quote.status !== QuoteStatus.sent && quote.status !== QuoteStatus.approved) {
      throw new BadRequestException('只有已批准或已发送报价可以标记为已拒绝');
    }
    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.rejected },
      include: { customer: true, items: true },
    });
    await this.writeAudit('quote.mark_rejected', quoteId, quote, updated);
    return updated;
  }

  async cancel(quoteId: string) {
    const quote = await this.prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });
    if (quote.status !== QuoteStatus.draft) throw new BadRequestException('只有草稿报价可以取消');
    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.canceled },
      include: { customer: true, items: true },
    });
    await this.writeAudit('quote.cancel', quoteId, quote, updated);
    return updated;
  }

  async newVersion(quoteId: string) {
    const quote = await this.detail(quoteId);
    const versionableStatuses: QuoteStatus[] = [QuoteStatus.approved, QuoteStatus.sent, QuoteStatus.accepted, QuoteStatus.rejected];
    if (!versionableStatuses.includes(quote.status)) {
      throw new BadRequestException('只有已审批或已发送后的报价可以创建新版本');
    }
    const nextVersion = quote.version + 1;
    await this.createVersionSnapshot(quoteId, `创建V${nextVersion}草稿前快照`);
    const draft = await this.prisma.quote.create({
      data: {
        quoteNo: `${quote.quoteNo}-V${nextVersion}`,
        version: nextVersion,
        customerId: quote.customerId,
        contactId: quote.contactId,
        opportunityId: quote.opportunityId,
        ownerId: quote.ownerId,
        priceBookId: quote.priceBookId,
        currency: quote.currency,
        status: QuoteStatus.draft,
        validUntil: quote.validUntil,
        paymentTerms: quote.paymentTerms,
        deliveryTerms: quote.deliveryTerms,
        remarks: quote.remarks,
        items: {
          create: quote.items.map((item) => ({
            productId: item.productId,
            lineNo: item.lineNo,
            productNameSnapshot: item.productNameSnapshot,
            skuSnapshot: item.skuSnapshot,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            optionConfigJson: item.optionConfigJson as Prisma.InputJsonValue | undefined,
            listAmount: item.listAmount,
            discountRate: item.discountRate,
            discountAmount: item.discountAmount,
            netAmount: item.netAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            totalAmount: item.totalAmount,
          })),
        },
      },
      include: { customer: true, items: true },
    });
    await this.writeAudit('quote.new_version', draft.id, quote, draft);
    return draft;
  }

  convertToOrder(quoteId: string) {
    return this.orders.convertFromQuote(quoteId);
  }

  async exportHtml(quoteId: string) {
    const quote = await this.detail(quoteId);
    await this.writeAudit('quote.export_html', quoteId, undefined, { quoteNo: quote.quoteNo });
    const rows = quote.items
      .map((item) => `
        <tr>
          <td>${item.lineNo}</td>
          <td>${this.escapeHtml(item.productNameSnapshot)}</td>
          <td>${this.escapeHtml(item.skuSnapshot)}</td>
          <td>${item.quantity}</td>
          <td>${item.unitPrice}</td>
          <td>${item.discountRate}</td>
          <td>${item.totalAmount}</td>
        </tr>
      `)
      .join('');
    return `<!doctype html>
      <html lang="zh-CN"><head><meta charset="utf-8" /><title>${quote.quoteNo}</title>
      <style>body{font-family:Arial,"Microsoft YaHei",sans-serif;padding:32px;color:#111827}h1{margin:0 0 8px}.meta{color:#6b7280;margin-bottom:24px}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{border:1px solid #d1d5db;padding:10px;text-align:left}th{background:#f3f4f6}.total{text-align:right;font-size:20px;font-weight:700}</style>
      </head><body><h1>报价单</h1><div class="meta">报价编号：${quote.quoteNo}　版本：V${quote.version}</div>
      <p>客户：${this.escapeHtml(quote.customer.name)}</p><p>状态：${quote.status}</p>
      <table><thead><tr><th>行号</th><th>产品</th><th>SKU</th><th>数量</th><th>单价</th><th>折扣率</th><th>含税总价</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="total">报价总额：¥${quote.totalAmount}</p>
      <p>付款条款：${this.escapeHtml(quote.paymentTerms ?? '')}</p><p>交付条款：${this.escapeHtml(quote.deliveryTerms ?? '')}</p></body></html>`;
  }

  private async nextQuoteNo() {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.quote.count({ where: { quoteNo: { startsWith: `Q-${date}` } } });
    return `Q-${date}-${String(count + 1).padStart(4, '0')}`;
  }

  private async nextLineNo(quoteId: string) {
    const count = await this.prisma.quoteItem.count({ where: { quoteId } });
    return count + 1;
  }

  private ensureDraft(status: QuoteStatus) {
    if (status !== QuoteStatus.draft) throw new BadRequestException('只有草稿报价可以编辑或提交');
  }

  private async getApprovalReasons(items: Array<{ discountRate: Prisma.Decimal }>, grossMarginRate: Prisma.Decimal, totalAmount: Prisma.Decimal) {
    const maxLineDiscountRate = items.reduce((max, item) => Math.max(max, item.discountRate.toNumber()), 0);
    return this.approvalRules.evaluate({
      maxLineDiscountRate,
      grossMarginRate: grossMarginRate.toNumber(),
      totalAmount: totalAmount.toNumber(),
    });
  }

  private async createVersionSnapshot(quoteId: string, changeNote: string) {
    const quote = await this.detail(quoteId);
    await this.prisma.quoteVersion.upsert({
      where: { quoteId_version: { quoteId, version: quote.version } },
      create: { quoteId, version: quote.version, snapshotJson: this.toJsonSafe(quote) as Prisma.InputJsonValue, changeNote },
      update: { snapshotJson: this.toJsonSafe(quote) as Prisma.InputJsonValue, changeNote },
    });
  }

  private writeAudit(action: string, quoteId: string, before?: unknown, after?: unknown) {
    return this.audit.write({
      action,
      resourceType: 'quote',
      resourceId: quoteId,
      before: before ? this.toJsonSafe(before) : undefined,
      after: after ? this.toJsonSafe(after) : undefined,
    });
  }

  private escapeHtml(value: string) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  private toJsonSafe(value: unknown) {
    return JSON.parse(JSON.stringify(value, (_key, current) => (typeof current === 'bigint' ? current.toString() : current)));
  }
}
