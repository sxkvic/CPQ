import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PaginationDto } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationDto) {
    const where = query.keyword
      ? {
          OR: [
            { username: { contains: query.keyword, mode: 'insensitive' as const } },
            { displayName: { contains: query.keyword, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((user) => this.toPublicUser(user)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  toPublicUser(user: User) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      roleCode: user.roleCode,
      status: user.status,
    };
  }
}
