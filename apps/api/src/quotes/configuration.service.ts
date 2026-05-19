import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SelectedOptionDto } from './dto/add-quote-item.dto';

type ValidationInput = {
  productId: string;
  quantity: number;
  selectedOptions?: SelectedOptionDto[];
  customerId?: string;
};

type ValidationMessage = {
  severity: string;
  message: string;
};

@Injectable()
export class ConfigurationService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(input: ValidationInput) {
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id: input.productId },
      include: {
        options: { include: { values: true } },
        configurationRules: { where: { status: 'active' } },
      },
    });

    const selectedValueIds = new Set(
      (input.selectedOptions ?? []).flatMap((option) => option.valueIds ?? []),
    );
    const messages: ValidationMessage[] = [];

    for (const option of product.options) {
      if (!option.isRequired) continue;
      const selected = option.values.some((value) => selectedValueIds.has(value.id));
      if (!selected) {
        messages.push({ severity: 'error', message: `请选择必选项：${option.name}` });
      }
    }

    let optionPriceDelta = new Prisma.Decimal(0);
    let optionCostDelta = new Prisma.Decimal(0);
    const selectedSummary: Array<{
      optionId: string;
      optionName: string;
      valueId: string;
      valueLabel: string;
      priceDelta: string;
      costDelta: string;
    }> = [];

    for (const option of product.options) {
      for (const value of option.values) {
        if (!selectedValueIds.has(value.id)) continue;
        optionPriceDelta = optionPriceDelta.add(value.priceDelta);
        optionCostDelta = optionCostDelta.add(value.costDelta);
        selectedSummary.push({
          optionId: option.id,
          optionName: option.name,
          valueId: value.id,
          valueLabel: value.label,
          priceDelta: value.priceDelta.toString(),
          costDelta: value.costDelta.toString(),
        });
      }
    }

    for (const rule of product.configurationRules) {
      const condition = rule.conditionJson as Record<string, unknown>;
      const action = rule.actionJson as Record<string, unknown>;
      if (!this.conditionMatches(condition, selectedValueIds, input.quantity)) continue;
      const valid = this.actionSatisfied(action, selectedValueIds, input.quantity);
      if (!valid) {
        messages.push({ severity: rule.severity, message: rule.message });
      }
    }

    return {
      valid: !messages.some((message) => message.severity === 'error'),
      messages,
      optionPriceDelta,
      optionCostDelta,
      selectedSummary,
    };
  }

  private conditionMatches(
    condition: Record<string, unknown>,
    selectedValueIds: Set<string>,
    quantity: number,
  ) {
    if (typeof condition.selectedValueId === 'string') {
      return selectedValueIds.has(condition.selectedValueId);
    }
    if (typeof condition.minQuantity === 'number') {
      return quantity >= condition.minQuantity;
    }
    return Object.keys(condition).length === 0;
  }

  private actionSatisfied(action: Record<string, unknown>, selectedValueIds: Set<string>, quantity: number) {
    if (typeof action.requireValueId === 'string') {
      return selectedValueIds.has(action.requireValueId);
    }
    if (typeof action.excludeValueId === 'string') {
      return !selectedValueIds.has(action.excludeValueId);
    }
    if (typeof action.minQuantity === 'number') {
      return quantity >= action.minQuantity;
    }
    if (typeof action.maxQuantity === 'number') {
      return quantity <= action.maxQuantity;
    }
    return true;
  }
}
