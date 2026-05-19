import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PaginationDto } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePriceBookItemDto } from './dto/create-price-book-item.dto';
import { CreatePriceBookDto } from './dto/create-price-book.dto';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationDto) {
    const where = query.keyword
      ? {
          OR: [
            { code: { contains: query.keyword, mode: 'insensitive' as const } },
            { name: { contains: query.keyword, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.priceBook.findMany({
        where,
        include: { items: { include: { product: true } } },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { effectiveAt: 'desc' },
      }),
      this.prisma.priceBook.count({ where }),
    ]);

    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  create(dto: CreatePriceBookDto) {
    return this.prisma.priceBook.create({
      data: {
        code: dto.code,
        name: dto.name,
        currency: dto.currency ?? 'CNY',
        region: dto.region,
        customerGrade: dto.customerGrade,
        channel: dto.channel,
        effectiveAt: dto.effectiveAt ? new Date(dto.effectiveAt) : new Date(),
        expiredAt: dto.expiredAt ? new Date(dto.expiredAt) : undefined,
      },
    });
  }

  detail(id: string) {
    return this.prisma.priceBook.findUniqueOrThrow({
      where: { id },
      include: { items: { include: { product: true } } },
    });
  }

  addItem(priceBookId: string, dto: CreatePriceBookItemDto) {
    return this.prisma.priceBookItem.create({
      data: {
        priceBookId,
        productId: dto.productId,
        minQuantity: dto.minQuantity ?? 1,
        maxQuantity: dto.maxQuantity,
        unitPrice: dto.unitPrice,
        costPrice: dto.costPrice,
      },
      include: { product: true },
    });
  }

  async exportItems(priceBookId: string) {
    const priceBook = await this.prisma.priceBook.findUniqueOrThrow({
      where: { id: priceBookId },
      include: { items: { include: { product: true } } },
    });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('price_items');
    sheet.columns = [
      { header: 'SKU', key: 'sku', width: 20 },
      { header: '产品名称', key: 'name', width: 28 },
      { header: '最小数量', key: 'minQuantity', width: 12 },
      { header: '最大数量', key: 'maxQuantity', width: 12 },
      { header: '销售单价', key: 'unitPrice', width: 16 },
      { header: '成本价', key: 'costPrice', width: 16 },
    ];
    priceBook.items.forEach((item) => {
      sheet.addRow({
        sku: item.product.sku,
        name: item.product.name,
        minQuantity: item.minQuantity,
        maxQuantity: item.maxQuantity ?? '',
        unitPrice: item.unitPrice.toString(),
        costPrice: item.costPrice?.toString() ?? '',
      });
    });
    sheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return {
      fileName: `${priceBook.code}-price-items.xlsx`,
      fileBase64: Buffer.from(buffer).toString('base64'),
    };
  }

  async importItems(priceBookId: string, fileBase64: string) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(fileBase64, 'base64') as unknown as ExcelJS.Buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return { imported: 0, skipped: 0 };
    }

    const rows: Array<{
      sku: string;
      minQuantity: number;
      maxQuantity?: number;
      unitPrice: number;
      costPrice?: number;
    }> = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const sku = String(row.getCell(1).value ?? '').trim();
      if (!sku) return;
      rows.push({
        sku,
        minQuantity: Number(row.getCell(3).value ?? 1),
        maxQuantity: row.getCell(4).value ? Number(row.getCell(4).value) : undefined,
        unitPrice: Number(row.getCell(5).value ?? 0),
        costPrice: row.getCell(6).value ? Number(row.getCell(6).value) : undefined,
      });
    });

    let imported = 0;
    let skipped = 0;
    for (const row of rows) {
      const product = await this.prisma.product.findUnique({ where: { sku: row.sku } });
      if (!product) {
        skipped += 1;
        continue;
      }
      await this.prisma.priceBookItem.create({
        data: {
          priceBookId,
          productId: product.id,
          minQuantity: row.minQuantity,
          maxQuantity: row.maxQuantity,
          unitPrice: row.unitPrice,
          costPrice: row.costPrice,
        },
      });
      imported += 1;
    }

    return { imported, skipped };
  }
}
