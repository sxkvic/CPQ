import { BadRequestException, Injectable } from '@nestjs/common';
import { ApprovalStatus, QuoteStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PaginationDto } from '../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async tasks(query: PaginationDto) {
    const [items, total] = await Promise.all([
      this.prisma.quoteApproval.findMany({
        where: { status: ApprovalStatus.pending },
        include: { quote: { include: { customer: true, items: true } }, logs: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.quoteApproval.count({ where: { status: ApprovalStatus.pending } }),
    ]);

    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  detail(id: string) {
    return this.prisma.quoteApproval.findUniqueOrThrow({
      where: { id },
      include: { quote: { include: { customer: true, items: true } }, logs: true },
    });
  }

  async approve(id: string, comment?: string) {
    const approval = await this.prisma.quoteApproval.findUniqueOrThrow({ where: { id } });
    if (approval.status !== ApprovalStatus.pending) {
      throw new BadRequestException('该审批已处理');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.quoteApprovalLog.create({
        data: {
          approvalId: id,
          step: approval.currentStep,
          action: 'approve',
          comment,
        },
      });
      const quote = await tx.quote.update({
        where: { id: approval.quoteId },
        data: { status: QuoteStatus.approved, approvedAt: new Date() },
        include: { customer: true, items: true },
      });
      const updated = await tx.quoteApproval.update({
        where: { id },
        data: { status: ApprovalStatus.approved, completedAt: new Date() },
        include: { quote: { include: { customer: true } }, logs: true },
      });
      await this.audit.write({
        action: 'quote.approve',
        resourceType: 'quote',
        resourceId: approval.quoteId,
        after: quote,
      });
      return updated;
    });
  }

  async reject(id: string, comment?: string) {
    const approval = await this.prisma.quoteApproval.findUniqueOrThrow({ where: { id } });
    if (approval.status !== ApprovalStatus.pending) {
      throw new BadRequestException('该审批已处理');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.quoteApprovalLog.create({
        data: {
          approvalId: id,
          step: approval.currentStep,
          action: 'reject',
          comment,
        },
      });
      const quote = await tx.quote.update({
        where: { id: approval.quoteId },
        data: { status: QuoteStatus.draft },
        include: { customer: true, items: true },
      });
      const updated = await tx.quoteApproval.update({
        where: { id },
        data: { status: ApprovalStatus.rejected, completedAt: new Date() },
        include: { quote: { include: { customer: true } }, logs: true },
      });
      await this.audit.write({
        action: 'quote.reject',
        resourceType: 'quote',
        resourceId: approval.quoteId,
        after: quote,
      });
      return updated;
    });
  }
}
