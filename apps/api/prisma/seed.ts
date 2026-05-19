import {
  ContractStatus,
  IntegrationEventStatus,
  PrismaClient,
  ProductStatus,
  ProductType,
  QuoteStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('admin123456', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      displayName: '系统管理员',
      roleCode: 'admin',
    },
  });

  const sales = await prisma.user.upsert({
    where: { username: 'sales01' },
    update: {},
    create: {
      username: 'sales01',
      passwordHash,
      displayName: '销售一号',
      roleCode: 'sales',
    },
  });

  const category = await prisma.productCategory.upsert({
    where: { code: 'EQUIPMENT' },
    update: {},
    create: {
      code: 'EQUIPMENT',
      name: '设备产品',
    },
  });

  const softwareCategory = await prisma.productCategory.upsert({
    where: { code: 'SOFTWARE' },
    update: {},
    create: {
      code: 'SOFTWARE',
      name: '软件订阅',
    },
  });

  const product = await prisma.product.upsert({
    where: { sku: 'EQ-1000' },
    update: {},
    create: {
      categoryId: category.id,
      sku: 'EQ-1000',
      name: '标准设备1000',
      productType: ProductType.physical,
      unit: '套',
      standardCost: 60000,
      standardPrice: 100000,
      status: ProductStatus.active,
      options: {
        create: [
          {
            code: 'POWER',
            name: '功率等级',
            optionType: 'single',
            isRequired: true,
            values: {
              create: [
                { code: 'STD', label: '标准功率', isDefault: true },
                { code: 'HIGH', label: '高功率', priceDelta: 15000, costDelta: 9000 },
              ],
            },
          },
        ],
      },
    },
  });

  const priceBook = await prisma.priceBook.upsert({
    where: { code: 'STD-CNY' },
    update: {},
    create: {
      code: 'STD-CNY',
      name: '标准人民币价格本',
      currency: 'CNY',
      region: '全国',
      items: {
        create: [
          {
            productId: product.id,
            unitPrice: 100000,
            costPrice: 60000,
          },
        ],
      },
    },
  });

  const software = await prisma.product.upsert({
    where: { sku: 'CPQ-SUB-ENT' },
    update: {},
    create: {
      categoryId: softwareCategory.id,
      sku: 'CPQ-SUB-ENT',
      name: '企业版CPQ订阅',
      productType: ProductType.software,
      unit: '年',
      standardCost: 30000,
      standardPrice: 80000,
      status: ProductStatus.active,
    },
  });

  await prisma.priceBookItem.upsert({
    where: { id: 'seed-price-software' },
    update: {},
    create: {
      id: 'seed-price-software',
      priceBookId: priceBook.id,
      productId: software.id,
      unitPrice: 80000,
      costPrice: 30000,
    },
  });

  const customer = await prisma.customer.upsert({
    where: { code: 'CUST-0001' },
    update: {},
    create: {
      code: 'CUST-0001',
      name: 'ABC制造有限公司',
      industry: '制造业',
      region: '华东',
      grade: 'A',
      ownerId: sales.id,
      contacts: {
        create: [{ name: '张经理', title: '采购经理', phone: '13800000000', isPrimary: true }],
      },
      opportunities: {
        create: [{ name: '标准产线设备采购', stage: 'proposal', ownerId: sales.id }],
      },
    },
  });

  await prisma.documentTemplate.upsert({
    where: { code: 'QUOTE-STANDARD-CN' },
    update: {},
    create: {
      code: 'QUOTE-STANDARD-CN',
      name: '标准中文报价模板',
      templateType: 'quote',
      isDefault: true,
      contentHtml:
        '<h1>报价单</h1><p>报价编号：{{quoteNo}} / V{{version}}</p><p>客户：{{customerName}}</p><table><thead><tr><th>行号</th><th>产品</th><th>SKU</th><th>数量</th><th>单价</th><th>折扣</th><th>含税总价</th></tr></thead><tbody>{{lineItems}}</tbody></table><p>总额：¥{{totalAmount}}</p><p>付款条款：{{paymentTerms}}</p><p>交付条款：{{deliveryTerms}}</p>',
    },
  });

  const quote = await prisma.quote.upsert({
    where: { quoteNo: 'Q-SEED-0001' },
    update: {},
    create: {
      quoteNo: 'Q-SEED-0001',
      customerId: customer.id,
      ownerId: sales.id,
      priceBookId: priceBook.id,
      status: QuoteStatus.accepted,
      subtotalAmount: 180000,
      taxAmount: 23400,
      totalAmount: 203400,
      totalCost: 90000,
      grossMarginRate: 0.5575,
      paymentTerms: '预付30%，验收后支付70%',
      deliveryTerms: '合同生效后30个工作日内交付',
      items: {
        create: [
          {
            productId: product.id,
            lineNo: 1,
            productNameSnapshot: product.name,
            skuSnapshot: product.sku,
            quantity: 1,
            unit: product.unit,
            unitPrice: 100000,
            costPrice: 60000,
            listAmount: 100000,
            netAmount: 100000,
            taxAmount: 13000,
            totalAmount: 113000,
          },
          {
            productId: software.id,
            lineNo: 2,
            productNameSnapshot: software.name,
            skuSnapshot: software.sku,
            quantity: 1,
            unit: software.unit,
            unitPrice: 80000,
            costPrice: 30000,
            listAmount: 80000,
            netAmount: 80000,
            taxAmount: 10400,
            totalAmount: 90400,
          },
        ],
      },
    },
  });

  const order = await prisma.order.upsert({
    where: { orderNo: 'O-SEED-0001' },
    update: {},
    create: {
      orderNo: 'O-SEED-0001',
      quoteId: quote.id,
      customerId: customer.id,
      status: 'confirmed',
      totalAmount: quote.totalAmount,
    },
  });

  const contract = await prisma.contract.upsert({
    where: { contractNo: 'C-SEED-0001' },
    update: {},
    create: {
      contractNo: 'C-SEED-0001',
      quoteId: quote.id,
      orderId: order.id,
      customerId: customer.id,
      status: ContractStatus.active,
      totalAmount: quote.totalAmount,
      paymentTerms: quote.paymentTerms,
      deliveryTerms: quote.deliveryTerms,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      signedAt: new Date(),
    },
  });

  await prisma.subscription.upsert({
    where: { subscriptionNo: 'S-SEED-0001' },
    update: {},
    create: {
      subscriptionNo: 'S-SEED-0001',
      contractId: contract.id,
      orderId: order.id,
      customerId: customer.id,
      productId: software.id,
      status: SubscriptionStatus.active,
      billingCycle: 'annual',
      quantity: 1,
      unitPrice: 80000,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      nextBillingAt: new Date(new Date().setDate(new Date().getDate() + 30)),
      autoRenew: true,
      renewalTermMonths: 12,
    },
  });

  const endpoint = await prisma.integrationEndpoint.upsert({
    where: { code: 'ERP-ORDER' },
    update: {},
    create: {
      code: 'ERP-ORDER',
      name: 'ERP订单同步',
      targetSystem: 'ERP',
      eventType: 'order.confirmed',
      url: 'http://erp.example.local/webhook/order',
      authType: 'token',
    },
  });

  await prisma.integrationEvent.upsert({
    where: { id: 'seed-integration-event-order' },
    update: {},
    create: {
      id: 'seed-integration-event-order',
      endpointId: endpoint.id,
      orderId: order.id,
      resourceType: 'order',
      resourceId: order.id,
      eventType: 'order.confirmed',
      status: IntegrationEventStatus.pending,
      payloadJson: { orderNo: order.orderNo, customerId: customer.id, totalAmount: order.totalAmount.toString() },
    },
  });

  console.log(`Seed completed. Admin: ${admin.username}, price book: ${priceBook.code}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
