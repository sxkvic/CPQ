import { Injectable } from '@nestjs/common';
import { Prisma, ProductStatus, ProductType } from '@prisma/client';
import ExcelJS from 'exceljs';
import { PaginationDto } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConfigurationRuleDto } from './dto/create-configuration-rule.dto';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationDto) {
    const where = query.keyword
      ? {
          OR: [
            { name: { contains: query.keyword, mode: 'insensitive' as const } },
            { sku: { contains: query.keyword, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, priceBookItems: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        categoryId: dto.categoryId,
        sku: dto.sku,
        name: dto.name,
        productType: dto.productType ?? ProductType.physical,
        unit: dto.unit ?? '件',
        standardCost: dto.standardCost,
        standardPrice: dto.standardPrice,
        description: dto.description,
        status: dto.status ?? ProductStatus.active,
      },
    });
  }

  detail(id: string) {
    return this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: {
        category: true,
        options: { include: { values: true }, orderBy: { sortOrder: 'asc' } },
        priceBookItems: { include: { priceBook: true } },
      },
    });
  }

  async exportExcel() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('products');
    sheet.columns = [
      { header: 'SKU', key: 'sku', width: 20 },
      { header: '产品名称', key: 'name', width: 28 },
      { header: '产品类型', key: 'productType', width: 16 },
      { header: '单位', key: 'unit', width: 12 },
      { header: '标准售价', key: 'standardPrice', width: 16 },
      { header: '标准成本', key: 'standardCost', width: 16 },
      { header: '状态', key: 'status', width: 14 },
      { header: '描述', key: 'description', width: 36 },
    ];
    const products = await this.prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    products.forEach((product) => {
      sheet.addRow({
        sku: product.sku,
        name: product.name,
        productType: product.productType,
        unit: product.unit,
        standardPrice: product.standardPrice.toString(),
        standardCost: product.standardCost?.toString() ?? '0',
        status: product.status,
        description: product.description ?? '',
      });
    });
    sheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return {
      fileName: 'products.xlsx',
      fileBase64: Buffer.from(buffer).toString('base64'),
    };
  }

  async importExcel(fileBase64: string) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(fileBase64, 'base64') as unknown as ExcelJS.Buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return { imported: 0 };
    }

    const rows: Array<{
      sku: string;
      name: string;
      productType: ProductType;
      unit: string;
      standardPrice: number;
      standardCost: number;
      status: ProductStatus;
      description: string;
    }> = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const sku = String(row.getCell(1).value ?? '').trim();
      const name = String(row.getCell(2).value ?? '').trim();
      if (!sku || !name) return;
      const productType = String(row.getCell(3).value ?? 'physical') as ProductType;
      const unit = String(row.getCell(4).value ?? '件');
      const standardPrice = Number(row.getCell(5).value ?? 0);
      const standardCost = Number(row.getCell(6).value ?? 0);
      const status = String(row.getCell(7).value ?? 'active') as ProductStatus;
      const description = String(row.getCell(8).value ?? '');

      rows.push({ sku, name, productType, unit, standardPrice, standardCost, status, description });
    });

    await Promise.all(
      rows.map((row) =>
        this.prisma.product.upsert({
          where: { sku: row.sku },
          create: row,
          update: row,
        }),
      ),
    );

    return { imported: rows.length };
  }

  update(id: string, dto: CreateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        sku: dto.sku,
        name: dto.name,
        productType: dto.productType,
        unit: dto.unit,
        standardCost: dto.standardCost,
        standardPrice: dto.standardPrice,
        description: dto.description,
        status: dto.status,
      },
    });
  }

  deactivate(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.inactive },
    });
  }

  activate(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.active },
    });
  }

  async listRules(query: PaginationDto) {
    const where = query.keyword
      ? {
          OR: [
            { code: { contains: query.keyword, mode: 'insensitive' as const } },
            { name: { contains: query.keyword, mode: 'insensitive' as const } },
            { message: { contains: query.keyword, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.configurationRule.findMany({
        where,
        include: { product: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.configurationRule.count({ where }),
    ]);

    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  createRule(dto: CreateConfigurationRuleDto) {
    return this.prisma.configurationRule.create({
      data: {
        productId: dto.productId,
        code: dto.code,
        name: dto.name,
        ruleType: dto.ruleType,
        conditionJson: dto.conditionJson as Prisma.InputJsonValue,
        actionJson: dto.actionJson as Prisma.InputJsonValue,
        message: dto.message,
        severity: dto.severity ?? 'error',
      },
      include: { product: true },
    });
  }

  updateRule(id: string, dto: CreateConfigurationRuleDto) {
    return this.prisma.configurationRule.update({
      where: { id },
      data: {
        productId: dto.productId,
        code: dto.code,
        name: dto.name,
        ruleType: dto.ruleType,
        conditionJson: dto.conditionJson as Prisma.InputJsonValue,
        actionJson: dto.actionJson as Prisma.InputJsonValue,
        message: dto.message,
        severity: dto.severity ?? 'error',
      },
      include: { product: true },
    });
  }

  async toggleRule(id: string) {
    const rule = await this.prisma.configurationRule.findUniqueOrThrow({ where: { id } });
    return this.prisma.configurationRule.update({
      where: { id },
      data: { status: rule.status === 'active' ? 'disabled' : 'active' },
      include: { product: true },
    });
  }
}
