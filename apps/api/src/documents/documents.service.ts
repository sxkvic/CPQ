import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PaginationDto } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentTemplateDto } from './dto/create-document-template.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listTemplates(query: PaginationDto) {
    const where = query.keyword
      ? {
          OR: [
            { code: { contains: query.keyword, mode: 'insensitive' as const } },
            { name: { contains: query.keyword, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.documentTemplate.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.documentTemplate.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async createTemplate(dto: CreateDocumentTemplateDto) {
    const template = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.documentTemplate.updateMany({
          where: { templateType: dto.templateType ?? 'quote' },
          data: { isDefault: false },
        });
      }
      return tx.documentTemplate.create({
        data: {
          code: dto.code,
          name: dto.name,
          templateType: dto.templateType ?? 'quote',
          contentHtml: dto.contentHtml,
          isDefault: dto.isDefault ?? false,
        },
      });
    });
    await this.audit.write({
      action: 'document_template.create',
      resourceType: 'document_template',
      resourceId: template.id,
      after: template,
    });
    return template;
  }

  listQuoteDocuments(quoteId: string) {
    return this.prisma.quoteDocument.findMany({
      where: { quoteId },
      include: { template: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateForQuote(quoteId: string, templateId?: string) {
    const quote = await this.prisma.quote.findUniqueOrThrow({
      where: { id: quoteId },
      include: {
        customer: true,
        contact: true,
        items: { orderBy: { lineNo: 'asc' }, include: { product: true } },
      },
    });
    const template = templateId
      ? await this.prisma.documentTemplate.findUniqueOrThrow({ where: { id: templateId } })
      : await this.prisma.documentTemplate.findFirst({
          where: { templateType: 'quote', isDefault: true, status: 'active' },
          orderBy: { updatedAt: 'desc' },
        });
    const documentNo = await this.nextDocumentNo();
    const htmlSnapshot = this.renderTemplate(
      template?.contentHtml ?? this.defaultQuoteTemplate(),
      {
        quoteNo: quote.quoteNo,
        version: String(quote.version),
        customerName: quote.customer.name,
        contactName: quote.contact?.name ?? '',
        status: quote.status,
        totalAmount: quote.totalAmount.toString(),
        paymentTerms: quote.paymentTerms ?? '',
        deliveryTerms: quote.deliveryTerms ?? '',
        lineItems: this.renderLineItems(quote.items),
      },
    );
    const document = await this.prisma.quoteDocument.create({
      data: {
        quoteId,
        templateId: template?.id,
        documentNo,
        title: `${quote.quoteNo} 报价文件`,
        htmlSnapshot,
      },
      include: { quote: true, template: true },
    });
    await this.audit.write({
      action: 'quote_document.generate',
      resourceType: 'quote',
      resourceId: quoteId,
      after: this.toJsonSafe(document),
    });
    return document;
  }

  private renderLineItems(items: Array<{ lineNo: number; productNameSnapshot: string; skuSnapshot: string; quantity: Prisma.Decimal; unitPrice: Prisma.Decimal; discountRate: Prisma.Decimal; totalAmount: Prisma.Decimal }>) {
    return items
      .map(
        (item) => `<tr><td>${item.lineNo}</td><td>${this.escapeHtml(item.productNameSnapshot)}</td><td>${this.escapeHtml(item.skuSnapshot)}</td><td>${item.quantity}</td><td>${item.unitPrice}</td><td>${item.discountRate}</td><td>${item.totalAmount}</td></tr>`,
      )
      .join('');
  }

  private renderTemplate(template: string, values: Record<string, string>) {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => values[key] ?? '');
  }

  private defaultQuoteTemplate() {
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8" /><style>body{font-family:Arial,"Microsoft YaHei",sans-serif;padding:32px;color:#111827}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{border:1px solid #d1d5db;padding:10px;text-align:left}th{background:#f3f4f6}.total{text-align:right;font-size:20px;font-weight:700}</style></head><body><h1>报价单</h1><p>报价编号：{{quoteNo}} / V{{version}}</p><p>客户：{{customerName}} {{contactName}}</p><table><thead><tr><th>行号</th><th>产品</th><th>SKU</th><th>数量</th><th>单价</th><th>折扣率</th><th>含税总价</th></tr></thead><tbody>{{lineItems}}</tbody></table><p class="total">总额：¥{{totalAmount}}</p><p>付款条款：{{paymentTerms}}</p><p>交付条款：{{deliveryTerms}}</p></body></html>`;
  }

  private async nextDocumentNo() {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.quoteDocument.count({
      where: { documentNo: { startsWith: `DOC-${date}` } },
    });
    return `DOC-${date}-${String(count + 1).padStart(4, '0')}`;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  private toJsonSafe(value: unknown) {
    return JSON.parse(JSON.stringify(value, (_key, current) => (typeof current === 'bigint' ? current.toString() : current)));
  }
}
