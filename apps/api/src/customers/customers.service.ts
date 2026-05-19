import { Injectable } from '@nestjs/common';
import { PaginationDto } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationDto) {
    const where = query.keyword
      ? { name: { contains: query.keyword, mode: 'insensitive' as const } }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: { owner: true, contacts: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        code: dto.code,
        name: dto.name,
        industry: dto.industry,
        region: dto.region,
        grade: dto.grade,
        taxNumber: dto.taxNumber,
        billingAddress: dto.billingAddress,
        ownerId: dto.ownerId,
        contacts: dto.contactName
          ? {
              create: {
                name: dto.contactName,
                phone: dto.contactPhone,
                email: dto.contactEmail,
                isPrimary: true,
              },
            }
          : undefined,
      },
      include: { contacts: true },
    });
  }

  detail(id: string) {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id },
      include: { contacts: true, opportunities: true, quotes: true },
    });
  }

  update(id: string, dto: CreateCustomerDto) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        industry: dto.industry,
        region: dto.region,
        grade: dto.grade,
        taxNumber: dto.taxNumber,
        billingAddress: dto.billingAddress,
        ownerId: dto.ownerId,
      },
      include: { contacts: true },
    });
  }

  disable(id: string) {
    return this.prisma.customer.update({
      where: { id },
      data: { status: 'disabled' },
    });
  }
}
