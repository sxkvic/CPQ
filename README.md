# CPQ Platform

CPQ Platform is a Configure, Price, Quote system built according to the design documents under `docs/zh`.

## Tech Stack

- Frontend: React, TypeScript, Vite, Ant Design
- Backend: NestJS, TypeScript, Prisma
- Database: PostgreSQL
- Deployment: Docker Compose

## Workspace

```text
apps/
  api/   Backend API
  web/   Frontend app
docs/
  zh/    Chinese product and technical documents
```

## Quick Start

Install dependencies:

```bash
npm install
```

Prepare environment:

```bash
cp .env.example .env
```

Start database:

```bash
docker compose up -d db
```

If Docker is not installed, install PostgreSQL locally and create this database manually:

```sql
CREATE USER cpq WITH PASSWORD 'cpq_password';
CREATE DATABASE cpq OWNER cpq;
```

Generate Prisma client and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

Start development servers:

```bash
npm run dev
```

Default local URLs:

- Web: http://localhost:5173
- API: http://localhost:3000/api/v1

## Preview Without Database

```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev.ps1
```

Stop preview:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/stop-dev.ps1
```

Health check:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/health.ps1
```

## Docker Compose

```bash
docker compose up -d --build
```

Open:

```text
http://localhost:8080
```

## Demo Account

After running `npm run db:seed`, use:

- Username: `admin`
- Password: `admin123456`

Mock mode also supports these demo usernames with any password:

- `sales01`: sales
- `pm01`: product manager
- `price01`: pricing manager
- `manager01`: sales manager / approver

## MVP Flow

1. Login with the demo account.
2. Check summary cards, status distributions, recent quotes, recent orders, active contracts, renewal queue, and integration failures under `工作台`.
3. Create or confirm customers under `客户管理`.
4. Create or confirm products under `产品管理`.
5. Import or export products with Excel under `产品管理`.
6. Maintain simple product rules under `配置规则`.
7. Create a price book and product prices under `价格管理`.
8. Import or export price book items with Excel under `价格管理`.
9. Maintain quote document templates under `文档模板`.
10. Adjust quote template defaults under `系统设置`.
11. Create a quote under `报价管理`.
12. Open quote detail, select product options in the product configurator, and add configured products.
13. Edit quote item quantity or discount while the quote is still draft.
14. Submit the quote for approval.
15. Approve or reject it under `审批中心`.
16. Generate quote documents and export the HTML quote document.
17. Mark the approved quote as sent, accepted, or rejected.
18. Convert an accepted quote to order.
19. Confirm created orders under `订单管理`.
20. Create or review contracts under `合同管理`; confirming an order also creates a contract draft.
21. Sign contracts and manage software subscriptions / renewal dates under `订阅续费`.
22. Review outbound ERP/CRM/finance events under `集成中心`.
23. Check cross-module audit logs under `审计日志`.

## Implemented CPQ Coverage

- Configure: product catalog, options, option values, configuration rules, validation API.
- Price: price books, tiered price items, cost price, discount, tax, margin and approval triggers.
- Quote: quote lifecycle, version snapshots, HTML export, document templates and generated document records.
- Approval: approval queue, approval logs, discount / margin / amount trigger reasons.
- Order: accepted quote conversion, order confirmation and downstream event creation.
- Contract: contract records from quotes/orders, signing, termination and contract status tracking.
- Subscription: software subscription records, billing cycle, renewal date, auto-renew and activation.
- Integration: outbound endpoints, event queue, success/failure/retry state for ERP/CRM/finance integrations.
- Governance: dashboard KPIs, status distributions, recent work queues and searchable audit logs.

When running without PostgreSQL, use the mock API:

```bash
npm run mock -w apps/api
```
