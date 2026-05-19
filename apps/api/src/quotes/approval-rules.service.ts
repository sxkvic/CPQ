import { Injectable } from '@nestjs/common';
import { Engine } from 'json-rules-engine';

type ApprovalFacts = {
  maxLineDiscountRate: number;
  grossMarginRate: number;
  totalAmount: number;
};

@Injectable()
export class ApprovalRulesService {
  async evaluate(facts: ApprovalFacts) {
    const engine = new Engine();

    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'maxLineDiscountRate',
            operator: 'greaterThan',
            value: 0.2,
          },
        ],
      },
      event: {
        type: 'approval-required',
        params: { reason: '明细行折扣超过20%' },
      },
    });

    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'grossMarginRate',
            operator: 'lessThan',
            value: 0.15,
          },
        ],
      },
      event: {
        type: 'approval-required',
        params: { reason: '毛利率低于15%' },
      },
    });

    engine.addRule({
      conditions: {
        all: [
          {
            fact: 'totalAmount',
            operator: 'greaterThan',
            value: 1000000,
          },
        ],
      },
      event: {
        type: 'approval-required',
        params: { reason: '报价总金额超过100万' },
      },
    });

    const result = await engine.run(facts);
    return result.events
      .map((event) => event.params?.reason)
      .filter((reason): reason is string => typeof reason === 'string');
  }
}
