import http from 'node:http';
import { URL } from 'node:url';

type Customer = {
  id: string;
  code: string;
  name: string;
  industry?: string;
  region?: string;
  grade?: string;
  contacts: Array<{ id: string; name: string; phone?: string }>;
};

type Product = {
  id: string;
  sku: string;
  name: string;
  productType: string;
  unit: string;
  standardPrice: number;
  standardCost: number;
  status: string;
  options?: Array<{
    id: string;
    code: string;
    name: string;
    optionType: string;
    isRequired: boolean;
    values: Array<{ id: string; label: string; priceDelta: number; costDelta: number; isDefault?: boolean }>;
  }>;
};

type QuoteItem = {
  id: string;
  lineNo: number;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountRate: number;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  optionConfigJson?: { selectedSummary?: Array<{ optionName: string; valueLabel: string }> };
};

type Quote = {
  id: string;
  quoteNo: string;
  version: number;
  customerId: string;
  customer?: Customer;
  contactId?: string;
  status: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  totalCost: number;
  grossMarginRate: number;
  items: QuoteItem[];
  versions: Array<{ id: string; version: number; changeNote: string; createdAt: string }>;
};

type ConfigurationRule = {
  id: string;
  productId: string;
  code: string;
  name: string;
  ruleType: string;
  conditionJson: Record<string, unknown>;
  actionJson: Record<string, unknown>;
  message: string;
  severity: string;
  status: string;
  product?: Product;
};

type Order = {
  id: string;
  orderNo: string;
  quoteId: string;
  customerId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customer?: Customer;
  quote?: Quote;
};

type Contract = {
  id: string;
  contractNo: string;
  quoteId?: string;
  orderId?: string;
  customerId: string;
  status: string;
  totalAmount: number;
  startDate?: string;
  endDate?: string;
};

type Subscription = {
  id: string;
  subscriptionNo: string;
  contractId?: string;
  orderId?: string;
  customerId: string;
  productId: string;
  status: string;
  billingCycle: string;
  quantity: number;
  unitPrice: number;
  startDate: string;
  endDate?: string;
  nextBillingAt?: string;
  autoRenew: boolean;
};

const customers: Customer[] = [
  {
    id: 'cust-1',
    code: 'CUST-0001',
    name: 'ABC制造有限公司',
    industry: '制造业',
    region: '华东',
    grade: 'A',
    contacts: [{ id: 'contact-1', name: '张经理', phone: '13800000000' }],
  },
];

const products: Product[] = [
  {
    id: 'prod-1',
    sku: 'EQ-1000',
    name: '标准设备1000',
    productType: 'physical',
    unit: '套',
    standardPrice: 100000,
    standardCost: 60000,
    status: 'active',
    options: [
      {
        id: 'opt-power',
        code: 'POWER',
        name: '功率等级',
        optionType: 'single',
        isRequired: true,
        values: [
          { id: 'val-power-standard', label: '标准功率', priceDelta: 0, costDelta: 0, isDefault: true },
          { id: 'val-power-high', label: '高功率', priceDelta: 15000, costDelta: 9000 },
        ],
      },
      {
        id: 'opt-warranty',
        code: 'WARRANTY',
        name: '质保年限',
        optionType: 'single',
        isRequired: false,
        values: [
          { id: 'val-warranty-1', label: '1年', priceDelta: 0, costDelta: 0, isDefault: true },
          { id: 'val-warranty-3', label: '3年', priceDelta: 8000, costDelta: 3000 },
        ],
      },
    ],
  },
  {
    id: 'prod-2',
    sku: 'SV-INS',
    name: '安装实施服务',
    productType: 'service',
    unit: '项',
    standardPrice: 12000,
    standardCost: 5000,
    status: 'active',
    options: [],
  },
];

const priceBooks = [
  {
    id: 'pb-1',
    code: 'STD-CNY',
    name: '标准人民币价格本',
    currency: 'CNY',
    region: '全国',
    status: 'active',
    items: [{ id: 'pbi-1', product: products[0] }],
  },
];

const quotes: Quote[] = [];
const configurationRules: ConfigurationRule[] = [
  {
    id: 'rule-1',
    productId: 'prod-1',
    code: 'RULE-HIGH-POWER-COOLING',
    name: '高功率需要增强散热',
    ruleType: 'require',
    conditionJson: { selectedOption: 'POWER_HIGH' },
    actionJson: { requireOption: 'COOLING_PLUS' },
    message: '选择高功率时必须选择增强散热。',
    severity: 'error',
    status: 'active',
    product: products[0],
  },
];
const approvals: Array<{
  id: string;
  status: string;
  triggerReasonsJson: string[];
  submittedAt: string;
  quote: Quote;
}> = [];
const orders: Order[] = [];
const contracts: Contract[] = [];
const subscriptions: Subscription[] = [];
const documentTemplates = [
  {
    id: 'tpl-1',
    code: 'QUOTE-STANDARD-CN',
    name: '标准中文报价模板',
    templateType: 'quote',
    contentHtml: '<h1>报价单</h1><p>{{quoteNo}}</p><table>{{lineItems}}</table>',
    isDefault: true,
    version: 1,
    status: 'active',
    updatedAt: new Date().toISOString(),
  },
];
const quoteDocuments: Array<{
  id: string;
  quoteId: string;
  documentNo: string;
  title: string;
  status: string;
  createdAt: string;
  template?: { name: string };
}> = [];
const integrationEndpoints = [
  {
    id: 'endpoint-1',
    code: 'ERP-ORDER',
    name: 'ERP订单同步',
    targetSystem: 'ERP',
    eventType: 'order.confirmed',
    url: 'http://erp.example.local/webhook/order',
    authType: 'token',
    status: 'active',
    events: [],
  },
];
const integrationEvents: Array<{
  id: string;
  endpointId?: string;
  resourceType: string;
  resourceId: string;
  eventType: string;
  status: string;
  retryCount: number;
  createdAt: string;
  endpoint?: { name: string };
}> = [];
const mockUsers = [
  { id: 'user-admin', username: 'admin', displayName: '系统管理员', roleCode: 'admin' },
  { id: 'user-sales', username: 'sales01', displayName: '销售一号', roleCode: 'sales' },
  { id: 'user-product', username: 'pm01', displayName: '产品经理', roleCode: 'product_manager' },
  { id: 'user-pricing', username: 'price01', displayName: '价格经理', roleCode: 'pricing_manager' },
  { id: 'user-approver', username: 'manager01', displayName: '销售经理', roleCode: 'sales_manager' },
];
const auditLogs: Array<{
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
}> = [];

const json = (response: http.ServerResponse, data: unknown, status = 200) => {
  response.writeHead(status, {
    'Content-Type': 'application/json;charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  });
  response.end(JSON.stringify(data));
};

const readBody = async (request: http.IncomingMessage) =>
  new Promise<Record<string, any>>((resolve) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      resolve(raw ? JSON.parse(raw) : {});
    });
  });

const page = (items: unknown[]) => ({ items, page: 1, pageSize: 20, total: items.length });

const withCustomer = (quote: Quote) => ({
  ...quote,
  customer: customers.find((customer) => customer.id === quote.customerId),
});

const recalculate = (quote: Quote) => {
  quote.subtotalAmount = quote.items.reduce((sum, item) => sum + item.netAmount, 0);
  quote.taxAmount = quote.items.reduce((sum, item) => sum + item.taxAmount, 0);
  quote.totalCost = quote.items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
  quote.totalAmount = quote.subtotalAmount + quote.taxAmount;
  quote.grossMarginRate = quote.totalAmount
    ? (quote.totalAmount - quote.totalCost) / quote.totalAmount
    : 0;
  return quote;
};

const writeAudit = (quoteId: string, action: string) => {
  auditLogs.unshift({
    id: `audit-${Date.now()}-${auditLogs.length}`,
    action,
    resourceType: 'quote',
    resourceId: quoteId,
    createdAt: new Date().toISOString(),
  });
};

const snapshot = (quote: Quote, changeNote: string) => {
  const existing = quote.versions.find((item) => item.version === quote.version);
  if (existing) {
    existing.changeNote = changeNote;
    existing.createdAt = new Date().toISOString();
    return;
  }
  quote.versions.unshift({
    id: `version-${Date.now()}-${quote.versions.length}`,
    version: quote.version,
    changeNote,
    createdAt: new Date().toISOString(),
  });
};

const withOrderRelations = (order: Order) => ({
  ...order,
  customer: customers.find((customer) => customer.id === order.customerId),
  quote: quotes.find((quote) => quote.id === order.quoteId),
});

const withContractRelations = (contract: Contract) => ({
  ...contract,
  customer: customers.find((customer) => customer.id === contract.customerId),
  quote: quotes.find((quote) => quote.id === contract.quoteId),
  order: orders.find((order) => order.id === contract.orderId),
  subscriptions: subscriptions.filter((subscription) => subscription.contractId === contract.id),
});

const withSubscriptionRelations = (subscription: Subscription) => ({
  ...subscription,
  customer: customers.find((customer) => customer.id === subscription.customerId),
  product: products.find((product) => product.id === subscription.productId),
  contract: contracts.find((contract) => contract.id === subscription.contractId),
  order: orders.find((order) => order.id === subscription.orderId),
});

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    });
    response.end();
    return;
  }

  const url = new URL(request.url ?? '/', 'http://localhost:3000');
  const path = url.pathname.replace(/^\/api\/v1/, '');

  if (request.method === 'POST' && path === '/auth/login') {
    const body = await readBody(request);
    const user = mockUsers.find((item) => item.username === body.username) ?? mockUsers[0];
    return json(response, {
      accessToken: `mock-token-${user.roleCode}`,
      user,
    });
  }

  if (request.method === 'GET' && path === '/auth/me') {
    return json(response, mockUsers[0]);
  }

  if (request.method === 'GET' && path === '/dashboard/summary') {
    const quoteStatus = Array.from(new Set(quotes.map((quote) => quote.status))).map((status) => ({
      status,
      count: quotes.filter((quote) => quote.status === status).length,
    }));
    const orderStatus = Array.from(new Set(orders.map((order) => order.status))).map((status) => ({
      status,
      count: orders.filter((order) => order.status === status).length,
    }));
    const contractStatus = Array.from(new Set(contracts.map((contract) => contract.status))).map((status) => ({
      status,
      count: contracts.filter((contract) => contract.status === status).length,
    }));
    const subscriptionStatus = Array.from(new Set(subscriptions.map((subscription) => subscription.status))).map((status) => ({
      status,
      count: subscriptions.filter((subscription) => subscription.status === status).length,
    }));
    return json(response, {
      cards: {
        draftQuotes: quotes.filter((quote) => quote.status === 'draft').length,
        pendingApprovals: approvals.filter((approval) => approval.status === 'pending').length,
        acceptedQuotes: quotes.filter((quote) => quote.status === 'accepted').length,
        convertedQuotes: quotes.filter((quote) => quote.status === 'converted').length,
        createdOrders: orders.filter((order) => order.status === 'created').length,
        confirmedOrders: orders.filter((order) => order.status === 'confirmed').length,
        acceptedAmount: quotes
          .filter((quote) => ['accepted', 'converted'].includes(quote.status))
          .reduce((sum, quote) => sum + quote.totalAmount, 0),
        orderAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        activeContracts: contracts.filter((contract) => contract.status === 'active').length,
        activeSubscriptions: subscriptions.filter((subscription) => subscription.status === 'active').length,
        renewalDueSubscriptions: subscriptions.filter((subscription) => subscription.status === 'active').length,
        failedIntegrationEvents: integrationEvents.filter((event) => event.status === 'failed').length,
      },
      quoteStatus,
      orderStatus,
      contractStatus,
      subscriptionStatus,
      recentQuotes: quotes.slice(0, 6).map(withCustomer),
      recentOrders: orders.slice(0, 6).map(withOrderRelations),
      recentContracts: contracts.slice(0, 6).map(withContractRelations),
      renewalPipeline: subscriptions.slice(0, 6).map(withSubscriptionRelations),
    });
  }

  if (request.method === 'GET' && path === '/customers') return json(response, page(customers));
  if (request.method === 'POST' && path === '/customers') {
    const body = await readBody(request);
    const customer = {
      id: `cust-${customers.length + 1}`,
      code: body.code,
      name: body.name,
      industry: body.industry,
      region: body.region,
      grade: body.grade,
      contacts: body.contactName
        ? [{ id: `contact-${Date.now()}`, name: body.contactName, phone: body.contactPhone }]
        : [],
    };
    customers.unshift(customer);
    return json(response, customer);
  }
  const customerIdMatch = path.match(/^\/customers\/([^/]+)$/);
  if (request.method === 'PUT' && customerIdMatch) {
    const body = await readBody(request);
    const customer = customers.find((item) => item.id === customerIdMatch[1]);
    if (!customer) return json(response, { message: 'Not found' }, 404);
    Object.assign(customer, {
      code: body.code,
      name: body.name,
      industry: body.industry,
      region: body.region,
      grade: body.grade,
    });
    return json(response, customer);
  }
  if (request.method === 'DELETE' && customerIdMatch) {
    const customer = customers.find((item) => item.id === customerIdMatch[1]);
    if (!customer) return json(response, { message: 'Not found' }, 404);
    (customer as any).status = 'disabled';
    return json(response, customer);
  }

  if (request.method === 'GET' && path === '/products') return json(response, page(products));
  const productDetailMatch = path.match(/^\/products\/([^/]+)$/);
  if (request.method === 'GET' && productDetailMatch) {
    const product = products.find((item) => item.id === productDetailMatch[1]);
    return product ? json(response, product) : json(response, { message: 'Not found' }, 404);
  }
  if (request.method === 'GET' && path === '/products/export/excel') {
    return json(response, {
      fileName: 'mock-products-export.txt',
      fileBase64: Buffer.from('Mock模式不生成真实Excel；真实后端会导出products.xlsx。').toString('base64'),
    });
  }
  if (request.method === 'POST' && path === '/products/import/excel') {
    return json(response, { imported: 0, note: 'Mock模式已接收文件，真实后端会解析Excel。' });
  }
  if (request.method === 'POST' && path === '/products') {
    const body = await readBody(request);
    const product = {
      id: `prod-${products.length + 1}`,
      sku: body.sku,
      name: body.name,
      productType: body.productType ?? 'physical',
      unit: body.unit ?? '件',
      standardPrice: Number(body.standardPrice ?? 0),
      standardCost: Number(body.standardCost ?? 0),
      status: 'active',
      options: [],
    };
    products.unshift(product);
    return json(response, product);
  }
  if (request.method === 'PUT' && productIdMatch) {
    const body = await readBody(request);
    const product = products.find((item) => item.id === productIdMatch[1]);
    if (!product) return json(response, { message: 'Not found' }, 404);
    Object.assign(product, {
      sku: body.sku,
      name: body.name,
      productType: body.productType ?? product.productType,
      unit: body.unit ?? product.unit,
      standardPrice: Number(body.standardPrice ?? product.standardPrice),
      standardCost: Number(body.standardCost ?? product.standardCost),
    });
    return json(response, product);
  }
  const productDeactivateMatch = path.match(/^\/products\/([^/]+)\/deactivate$/);
  if (request.method === 'POST' && productDeactivateMatch) {
    const product = products.find((item) => item.id === productDeactivateMatch[1]);
    if (!product) return json(response, { message: 'Not found' }, 404);
    product.status = 'inactive';
    return json(response, product);
  }
  const productActivateMatch = path.match(/^\/products\/([^/]+)\/activate$/);
  if (request.method === 'POST' && productActivateMatch) {
    const product = products.find((item) => item.id === productActivateMatch[1]);
    if (!product) return json(response, { message: 'Not found' }, 404);
    product.status = 'active';
    return json(response, product);
  }

  if (request.method === 'GET' && path === '/configuration-rules') {
    return json(
      response,
      page(
        configurationRules.map((rule) => ({
          ...rule,
          product: products.find((product) => product.id === rule.productId),
        })),
      ),
    );
  }
  if (request.method === 'POST' && path === '/configuration-rules') {
    const body = await readBody(request);
    const rule = {
      id: `rule-${configurationRules.length + 1}`,
      productId: body.productId,
      code: body.code,
      name: body.name,
      ruleType: body.ruleType,
      conditionJson: body.conditionJson,
      actionJson: body.actionJson,
      message: body.message,
      severity: body.severity ?? 'error',
      status: 'active',
      product: products.find((product) => product.id === body.productId),
    };
    configurationRules.unshift(rule);
    return json(response, rule);
  }
  const configRuleMatch = path.match(/^\/configuration-rules\/([^/]+)$/);
  if (request.method === 'PUT' && configRuleMatch) {
    const body = await readBody(request);
    const rule = configurationRules.find((item) => item.id === configRuleMatch[1]);
    if (!rule) return json(response, { message: 'Not found' }, 404);
    Object.assign(rule, {
      productId: body.productId,
      code: body.code,
      name: body.name,
      ruleType: body.ruleType,
      conditionJson: body.conditionJson,
      actionJson: body.actionJson,
      message: body.message,
      severity: body.severity,
      product: products.find((product) => product.id === body.productId),
    });
    return json(response, rule);
  }
  const configRuleToggleMatch = path.match(/^\/configuration-rules\/([^/]+)\/toggle$/);
  if (request.method === 'POST' && configRuleToggleMatch) {
    const rule = configurationRules.find((item) => item.id === configRuleToggleMatch[1]);
    if (!rule) return json(response, { message: 'Not found' }, 404);
    rule.status = rule.status === 'active' ? 'disabled' : 'active';
    return json(response, rule);
  }

  if (request.method === 'GET' && path === '/price-books') return json(response, page(priceBooks));
  if (request.method === 'POST' && path === '/price-books') {
    const body = await readBody(request);
    const priceBook = {
      id: `pb-${priceBooks.length + 1}`,
      code: body.code,
      name: body.name,
      currency: body.currency ?? 'CNY',
      region: body.region,
      status: 'active',
      items: [],
    };
    priceBooks.unshift(priceBook);
    return json(response, priceBook);
  }

  if (request.method === 'POST' && /^\/price-books\/[^/]+\/items$/.test(path)) {
    return json(response, { id: `pbi-${Date.now()}` });
  }
  const priceBookExportMatch = path.match(/^\/price-books\/([^/]+)\/items\/export\/excel$/);
  if (request.method === 'GET' && priceBookExportMatch) {
    return json(response, {
      fileName: 'mock-price-items-export.txt',
      fileBase64: Buffer.from('Mock模式不生成真实Excel；真实后端会导出价格明细xlsx。').toString('base64'),
    });
  }
  const priceBookImportMatch = path.match(/^\/price-books\/([^/]+)\/items\/import\/excel$/);
  if (request.method === 'POST' && priceBookImportMatch) {
    return json(response, { imported: 0, skipped: 0, note: 'Mock模式已接收文件，真实后端会解析Excel。' });
  }

  if (request.method === 'GET' && path === '/quotes') return json(response, page(quotes.map(withCustomer)));
  if (request.method === 'POST' && path === '/quotes/configuration/validate') {
    const body = await readBody(request);
    const product = products.find((item) => item.id === body.productId);
    if (!product) return json(response, { message: 'Not found' }, 404);
    const selectedValueIds = new Set((body.selectedOptions ?? []).flatMap((item: any) => item.valueIds ?? []));
    const messages: Array<{ severity: string; message: string }> = [];
    const selectedSummary: Array<{ optionName: string; valueLabel: string }> = [];
    let optionPriceDelta = 0;
    let optionCostDelta = 0;
    for (const option of product.options ?? []) {
      const selected = option.values.filter((value) => selectedValueIds.has(value.id));
      if (option.isRequired && selected.length === 0) {
        messages.push({ severity: 'error', message: `请选择必选项：${option.name}` });
      }
      for (const value of selected) {
        optionPriceDelta += value.priceDelta;
        optionCostDelta += value.costDelta;
        selectedSummary.push({ optionName: option.name, valueLabel: value.label });
      }
    }
    return json(response, {
      valid: !messages.some((item) => item.severity === 'error'),
      messages,
      optionPriceDelta,
      optionCostDelta,
      selectedSummary,
    });
  }
  if (request.method === 'POST' && path === '/quotes') {
    const body = await readBody(request);
    const quote: Quote = {
      id: `quote-${quotes.length + 1}`,
      quoteNo: `Q-MOCK-${String(quotes.length + 1).padStart(4, '0')}`,
      version: 1,
      customerId: body.customerId,
      contactId: body.contactId,
      status: 'draft',
      subtotalAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      totalCost: 0,
      grossMarginRate: 0,
      items: [],
      versions: [],
    };
    quotes.unshift(quote);
    writeAudit(quote.id, 'quote.create');
    return json(response, withCustomer(quote));
  }

  const quoteIdMatch = path.match(/^\/quotes\/([^/]+)$/);
  if (request.method === 'GET' && quoteIdMatch) {
    const quote = quotes.find((item) => item.id === quoteIdMatch[1]);
    return quote ? json(response, withCustomer(quote)) : json(response, { message: 'Not found' }, 404);
  }
  const quoteAuditMatch = path.match(/^\/quotes\/([^/]+)\/audit-logs$/);
  if (request.method === 'GET' && quoteAuditMatch) {
    return json(
      response,
      auditLogs.filter((item) => item.resourceId === quoteAuditMatch[1]),
    );
  }
  const quoteDocumentsMatch = path.match(/^\/quotes\/([^/]+)\/documents$/);
  if (request.method === 'GET' && quoteDocumentsMatch) {
    return json(response, quoteDocuments.filter((item) => item.quoteId === quoteDocumentsMatch[1]));
  }
  const quoteGenerateDocumentMatch = path.match(/^\/quotes\/([^/]+)\/documents\/generate$/);
  if (request.method === 'POST' && quoteGenerateDocumentMatch) {
    const quote = quotes.find((item) => item.id === quoteGenerateDocumentMatch[1]);
    if (!quote) return json(response, { message: 'Not found' }, 404);
    const document = {
      id: `doc-${quoteDocuments.length + 1}`,
      quoteId: quote.id,
      documentNo: `DOC-MOCK-${String(quoteDocuments.length + 1).padStart(4, '0')}`,
      title: `${quote.quoteNo} 报价文件`,
      status: 'generated',
      createdAt: new Date().toISOString(),
      template: { name: '标准中文报价模板' },
    };
    quoteDocuments.unshift(document);
    writeAudit(quote.id, 'quote_document.generate');
    return json(response, document);
  }
  const quoteNewVersionMatch = path.match(/^\/quotes\/([^/]+)\/new-version$/);
  if (request.method === 'POST' && quoteNewVersionMatch) {
    const quote = quotes.find((item) => item.id === quoteNewVersionMatch[1]);
    if (!quote) return json(response, { message: 'Not found' }, 404);
    snapshot(quote, `创建V${quote.version + 1}草稿前快照`);
    const draft: Quote = {
      ...JSON.parse(JSON.stringify(quote)),
      id: `quote-${quotes.length + 1}`,
      quoteNo: `${quote.quoteNo}-V${quote.version + 1}`,
      version: quote.version + 1,
      status: 'draft',
      versions: [],
    };
    quotes.unshift(draft);
    writeAudit(draft.id, 'quote.new_version');
    return json(response, withCustomer(draft));
  }

  const quoteItemMatch = path.match(/^\/quotes\/([^/]+)\/items$/);
  if (request.method === 'POST' && quoteItemMatch) {
    const body = await readBody(request);
    const quote = quotes.find((item) => item.id === quoteItemMatch[1]);
    const product = products.find((item) => item.id === body.productId);
    if (!quote || !product) return json(response, { message: 'Not found' }, 404);
    const quantity = Number(body.quantity ?? 1);
    const discountRate = Number(body.discountRate ?? 0);
    const selectedValueIds = new Set((body.selectedOptions ?? []).flatMap((item: any) => item.valueIds ?? []));
    let optionPriceDelta = 0;
    let optionCostDelta = 0;
    const selectedSummary: Array<{ optionName: string; valueLabel: string }> = [];
    for (const option of product.options ?? []) {
      for (const value of option.values) {
        if (!selectedValueIds.has(value.id)) continue;
        optionPriceDelta += value.priceDelta;
        optionCostDelta += value.costDelta;
        selectedSummary.push({ optionName: option.name, valueLabel: value.label });
      }
    }
    const unitPrice = product.standardPrice + optionPriceDelta;
    const costPrice = product.standardCost + optionCostDelta;
    const netAmount = unitPrice * quantity * (1 - discountRate);
    quote.items.push({
      id: `qi-${Date.now()}`,
      lineNo: quote.items.length + 1,
      productId: product.id,
      productNameSnapshot: product.name,
      skuSnapshot: product.sku,
      quantity,
      unitPrice,
      costPrice,
      discountRate,
      netAmount,
      taxAmount: netAmount * 0.13,
      totalAmount: netAmount * 1.13,
      optionConfigJson: { selectedSummary },
    });
    writeAudit(quote.id, 'quote.item.add');
    return json(response, withCustomer(recalculate(quote)));
  }
  const quoteItemActionMatch = path.match(/^\/quotes\/items\/([^/]+)$/);
  if ((request.method === 'PUT' || request.method === 'DELETE') && quoteItemActionMatch) {
    const quote = quotes.find((item) =>
      item.items.some((quoteItem) => quoteItem.id === quoteItemActionMatch[1]),
    );
    if (!quote || quote.status !== 'draft') return json(response, { message: 'Not editable' }, 400);
    const item = quote.items.find((quoteItem) => quoteItem.id === quoteItemActionMatch[1]);
    if (!item) return json(response, { message: 'Not found' }, 404);
    if (request.method === 'DELETE') {
      quote.items = quote.items.filter((quoteItem) => quoteItem.id !== item.id);
      quote.items.forEach((quoteItem, index) => {
        quoteItem.lineNo = index + 1;
      });
      writeAudit(quote.id, 'quote.item.remove');
      return json(response, withCustomer(recalculate(quote)));
    }
    const body = await readBody(request);
    item.quantity = Number(body.quantity ?? item.quantity);
    item.discountRate = Number(body.discountRate ?? item.discountRate);
    item.netAmount = item.unitPrice * item.quantity * (1 - item.discountRate);
    item.taxAmount = item.netAmount * 0.13;
    item.totalAmount = item.netAmount + item.taxAmount;
    writeAudit(quote.id, 'quote.item.update');
    return json(response, withCustomer(recalculate(quote)));
  }

  const submitMatch = path.match(/^\/quotes\/([^/]+)\/submit$/);
  if (request.method === 'POST' && submitMatch) {
    const quote = quotes.find((item) => item.id === submitMatch[1]);
    if (!quote) return json(response, { message: 'Not found' }, 404);
    quote.status = 'pending_approval';
    snapshot(quote, '提交审批快照');
    writeAudit(quote.id, 'quote.submit');
    const approval = {
      id: `approval-${approvals.length + 1}`,
      status: 'pending',
      triggerReasonsJson: quote.grossMarginRate < 0.15 ? ['毛利率低于15%'] : ['标准报价提交审批'],
      submittedAt: new Date().toISOString(),
      quote: withCustomer(quote),
    };
    approvals.unshift(approval);
    return json(response, withCustomer(quote));
  }

  const markSentMatch = path.match(/^\/quotes\/([^/]+)\/mark-sent$/);
  if (request.method === 'POST' && markSentMatch) {
    const quote = quotes.find((item) => item.id === markSentMatch[1]);
    if (!quote) return json(response, { message: 'Not found' }, 404);
    quote.status = 'sent';
    writeAudit(quote.id, 'quote.mark_sent');
    return json(response, withCustomer(quote));
  }
  const markAcceptedMatch = path.match(/^\/quotes\/([^/]+)\/mark-accepted$/);
  if (request.method === 'POST' && markAcceptedMatch) {
    const quote = quotes.find((item) => item.id === markAcceptedMatch[1]);
    if (!quote) return json(response, { message: 'Not found' }, 404);
    quote.status = 'accepted';
    writeAudit(quote.id, 'quote.mark_accepted');
    return json(response, withCustomer(quote));
  }
  const convertToOrderMatch = path.match(/^\/quotes\/([^/]+)\/convert-to-order$/);
  if (request.method === 'POST' && convertToOrderMatch) {
    const quote = quotes.find((item) => item.id === convertToOrderMatch[1]);
    if (!quote) return json(response, { message: 'Not found' }, 404);
    if (quote.status !== 'accepted') return json(response, { message: 'Only accepted quote can convert' }, 400);
    const existing = orders.find((order) => order.quoteId === quote.id);
    if (existing) return json(response, withOrderRelations(existing));
    const order: Order = {
      id: `order-${orders.length + 1}`,
      orderNo: `O-MOCK-${String(orders.length + 1).padStart(4, '0')}`,
      quoteId: quote.id,
      customerId: quote.customerId,
      status: 'created',
      totalAmount: quote.totalAmount,
      createdAt: new Date().toISOString(),
    };
    quote.status = 'converted';
    orders.unshift(order);
    writeAudit(quote.id, 'quote.convert_to_order');
    return json(response, withOrderRelations(order));
  }
  const markRejectedMatch = path.match(/^\/quotes\/([^/]+)\/mark-rejected$/);
  if (request.method === 'POST' && markRejectedMatch) {
    const quote = quotes.find((item) => item.id === markRejectedMatch[1]);
    if (!quote) return json(response, { message: 'Not found' }, 404);
    quote.status = 'rejected';
    writeAudit(quote.id, 'quote.mark_rejected');
    return json(response, withCustomer(quote));
  }
  const cancelMatch = path.match(/^\/quotes\/([^/]+)\/cancel$/);
  if (request.method === 'POST' && cancelMatch) {
    const quote = quotes.find((item) => item.id === cancelMatch[1]);
    if (!quote) return json(response, { message: 'Not found' }, 404);
    quote.status = 'canceled';
    writeAudit(quote.id, 'quote.cancel');
    return json(response, withCustomer(quote));
  }

  const exportMatch = path.match(/^\/quotes\/([^/]+)\/export\/html$/);
  if (request.method === 'GET' && exportMatch) {
    const quote = quotes.find((item) => item.id === exportMatch[1]);
    const rows =
      quote?.items
        .map(
          (item) => `
            <tr>
              <td>${item.lineNo}</td>
              <td>${item.productNameSnapshot}</td>
              <td>${item.skuSnapshot}</td>
              <td>${item.quantity}</td>
              <td>¥${item.unitPrice.toFixed(2)}</td>
              <td>${(item.discountRate * 100).toFixed(0)}%</td>
              <td>¥${item.totalAmount.toFixed(2)}</td>
            </tr>
          `,
        )
        .join('') ?? '';
    response.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
    response.end(`
      <section style="font-family: Arial, 'Microsoft YaHei', sans-serif; padding: 32px; color: #111827;">
        <h1 style="margin: 0 0 8px;">报价单</h1>
        <p style="color: #6b7280;">报价编号：${quote?.quoteNo ?? ''}</p>
        <p>客户：${customers.find((customer) => customer.id === quote?.customerId)?.name ?? ''}</p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #d1d5db; padding: 10px; background: #f3f4f6;">行号</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; background: #f3f4f6;">产品</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; background: #f3f4f6;">SKU</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; background: #f3f4f6;">数量</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; background: #f3f4f6;">单价</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; background: #f3f4f6;">折扣</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; background: #f3f4f6;">总价</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="text-align: right; font-size: 20px; font-weight: 700;">报价总额：¥${quote?.totalAmount.toFixed(2) ?? '0.00'}</p>
      </section>
    `);
    return;
  }

  if (request.method === 'GET' && path === '/approvals/tasks') return json(response, page(approvals));
  const approvalActionMatch = path.match(/^\/approvals\/([^/]+)\/(approve|reject)$/);
  if (request.method === 'POST' && approvalActionMatch) {
    const approval = approvals.find((item) => item.id === approvalActionMatch[1]);
    if (!approval) return json(response, { message: 'Not found' }, 404);
    approval.status = approvalActionMatch[2] === 'approve' ? 'approved' : 'rejected';
    approval.quote.status = approvalActionMatch[2] === 'approve' ? 'approved' : 'draft';
    writeAudit(approval.quote.id, approvalActionMatch[2] === 'approve' ? 'quote.approve' : 'quote.reject');
    return json(response, approval);
  }

  if (request.method === 'GET' && path === '/orders') {
    return json(response, page(orders.map(withOrderRelations)));
  }
  const orderDetailMatch = path.match(/^\/orders\/([^/]+)$/);
  if (request.method === 'GET' && orderDetailMatch) {
    const order = orders.find((item) => item.id === orderDetailMatch[1]);
    return order ? json(response, withOrderRelations(order)) : json(response, { message: 'Not found' }, 404);
  }
  const orderConfirmMatch = path.match(/^\/orders\/([^/]+)\/confirm$/);
  if (request.method === 'POST' && orderConfirmMatch) {
    const order = orders.find((item) => item.id === orderConfirmMatch[1]);
    if (!order) return json(response, { message: 'Not found' }, 404);
    order.status = 'confirmed';
    const existingContract = contracts.find((contract) => contract.orderId === order.id);
    if (!existingContract) {
      contracts.unshift({
        id: `contract-${contracts.length + 1}`,
        contractNo: `C-MOCK-${String(contracts.length + 1).padStart(4, '0')}`,
        quoteId: order.quoteId,
        orderId: order.id,
        customerId: order.customerId,
        status: 'draft',
        totalAmount: order.totalAmount,
        startDate: new Date().toISOString(),
      });
    }
    integrationEvents.unshift({
      id: `event-${integrationEvents.length + 1}`,
      endpointId: 'endpoint-1',
      resourceType: 'order',
      resourceId: order.id,
      eventType: 'order.confirmed',
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
      endpoint: { name: 'ERP订单同步' },
    });
    return json(response, withOrderRelations(order));
  }

  if (request.method === 'GET' && path === '/document-templates') return json(response, page(documentTemplates));
  if (request.method === 'POST' && path === '/document-templates') {
    const body = await readBody(request);
    const template = {
      id: `tpl-${documentTemplates.length + 1}`,
      code: body.code,
      name: body.name,
      templateType: body.templateType ?? 'quote',
      contentHtml: body.contentHtml,
      isDefault: Boolean(body.isDefault),
      version: 1,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
    documentTemplates.unshift(template);
    return json(response, template);
  }

  if (request.method === 'GET' && path === '/contracts') return json(response, page(contracts.map(withContractRelations)));
  if (request.method === 'POST' && path === '/contracts') {
    const body = await readBody(request);
    const quote = quotes.find((item) => item.id === body.quoteId);
    const order = orders.find((item) => item.id === body.orderId);
    const contract: Contract = {
      id: `contract-${contracts.length + 1}`,
      contractNo: `C-MOCK-${String(contracts.length + 1).padStart(4, '0')}`,
      quoteId: body.quoteId,
      orderId: body.orderId,
      customerId: body.customerId,
      status: 'draft',
      totalAmount: Number(order?.totalAmount ?? quote?.totalAmount ?? 0),
      startDate: body.startDate,
      endDate: body.endDate,
    };
    contracts.unshift(contract);
    return json(response, withContractRelations(contract));
  }
  const contractSignMatch = path.match(/^\/contracts\/([^/]+)\/sign$/);
  if (request.method === 'POST' && contractSignMatch) {
    const contract = contracts.find((item) => item.id === contractSignMatch[1]);
    if (!contract) return json(response, { message: 'Not found' }, 404);
    contract.status = 'active';
    const quote = quotes.find((item) => item.id === contract.quoteId);
    for (const item of quote?.items ?? []) {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (product?.productType !== 'software') continue;
      subscriptions.unshift({
        id: `sub-${subscriptions.length + 1}`,
        subscriptionNo: `S-MOCK-${String(subscriptions.length + 1).padStart(4, '0')}`,
        contractId: contract.id,
        orderId: contract.orderId,
        customerId: contract.customerId,
        productId: product.id,
        status: 'active',
        billingCycle: 'annual',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        startDate: contract.startDate ?? new Date().toISOString(),
        endDate: contract.endDate,
        nextBillingAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        autoRenew: true,
      });
    }
    return json(response, withContractRelations(contract));
  }
  const contractTerminateMatch = path.match(/^\/contracts\/([^/]+)\/terminate$/);
  if (request.method === 'POST' && contractTerminateMatch) {
    const contract = contracts.find((item) => item.id === contractTerminateMatch[1]);
    if (!contract) return json(response, { message: 'Not found' }, 404);
    contract.status = 'terminated';
    return json(response, withContractRelations(contract));
  }

  if (request.method === 'GET' && path === '/subscriptions/renewal-summary') {
    const now = Date.now();
    const in30Days = now + 30 * 24 * 3600 * 1000;
    const in90Days = now + 90 * 24 * 3600 * 1000;
    const activeSubscriptions = subscriptions.filter((item) => item.status === 'active');
    const dueIn90Days = activeSubscriptions.filter((item) => {
      const time = item.nextBillingAt ? new Date(item.nextBillingAt).getTime() : undefined;
      return time !== undefined && time >= now && time <= in90Days;
    });
    return json(response, {
      overdue: activeSubscriptions.filter((item) => item.nextBillingAt && new Date(item.nextBillingAt).getTime() < now).length,
      dueIn30Days: activeSubscriptions.filter((item) => {
        const time = item.nextBillingAt ? new Date(item.nextBillingAt).getTime() : undefined;
        return time !== undefined && time >= now && time <= in30Days;
      }).length,
      dueIn90Days: dueIn90Days.length,
      autoRenew: activeSubscriptions.filter((item) => item.autoRenew).length,
      missingBillingDate: activeSubscriptions.filter((item) => !item.nextBillingAt).length,
      amountDueIn90Days: dueIn90Days.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    });
  }
  if (request.method === 'GET' && path === '/subscriptions') return json(response, page(subscriptions.map(withSubscriptionRelations)));
  if (request.method === 'POST' && path === '/subscriptions') {
    const body = await readBody(request);
    const subscription: Subscription = {
      id: `sub-${subscriptions.length + 1}`,
      subscriptionNo: `S-MOCK-${String(subscriptions.length + 1).padStart(4, '0')}`,
      contractId: body.contractId,
      orderId: body.orderId,
      customerId: body.customerId,
      productId: body.productId,
      status: 'pending',
      billingCycle: body.billingCycle ?? 'monthly',
      quantity: Number(body.quantity ?? 1),
      unitPrice: Number(body.unitPrice ?? 0),
      startDate: body.startDate,
      endDate: body.endDate,
      nextBillingAt: body.nextBillingAt,
      autoRenew: Boolean(body.autoRenew),
    };
    subscriptions.unshift(subscription);
    return json(response, withSubscriptionRelations(subscription));
  }
  const subscriptionActivateMatch = path.match(/^\/subscriptions\/([^/]+)\/activate$/);
  if (request.method === 'POST' && subscriptionActivateMatch) {
    const subscription = subscriptions.find((item) => item.id === subscriptionActivateMatch[1]);
    if (!subscription) return json(response, { message: 'Not found' }, 404);
    subscription.status = 'active';
    return json(response, withSubscriptionRelations(subscription));
  }

  if (request.method === 'GET' && path === '/integrations/endpoints') return json(response, page(integrationEndpoints));
  if (request.method === 'POST' && path === '/integrations/endpoints') {
    const body = await readBody(request);
    const endpoint = { id: `endpoint-${integrationEndpoints.length + 1}`, ...body, status: 'active', events: [] };
    integrationEndpoints.unshift(endpoint);
    return json(response, endpoint);
  }
  if (request.method === 'GET' && path === '/integrations/events') return json(response, page(integrationEvents));
  const integrationSentMatch = path.match(/^\/integrations\/events\/([^/]+)\/mark-sent$/);
  if (request.method === 'POST' && integrationSentMatch) {
    const event = integrationEvents.find((item) => item.id === integrationSentMatch[1]);
    if (!event) return json(response, { message: 'Not found' }, 404);
    event.status = 'sent';
    return json(response, event);
  }
  const integrationFailedMatch = path.match(/^\/integrations\/events\/([^/]+)\/mark-failed$/);
  if (request.method === 'POST' && integrationFailedMatch) {
    const event = integrationEvents.find((item) => item.id === integrationFailedMatch[1]);
    if (!event) return json(response, { message: 'Not found' }, 404);
    event.status = 'failed';
    event.retryCount += 1;
    return json(response, event);
  }

  if (request.method === 'GET' && path === '/audit-logs') return json(response, page(auditLogs));

  return json(response, { message: `No mock route: ${request.method} ${path}` }, 404);
});

server.listen(3000, () => {
  console.log('Mock API listening on http://localhost:3000/api/v1');
});
