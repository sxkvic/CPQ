# CPQ System Executive Summary

## 1. What We Are Building

We will build an internal CPQ system for sales quotation management.

CPQ stands for Configure, Price, Quote:

- Configure: choose valid product models, options, bundles, and services.
- Price: calculate product price, option price, discounts, tax, fees, cost, and margin.
- Quote: generate approved customer quotation documents and track quote versions.

## 2. Why It Is Needed

Current manual quotation processes usually have these problems:

- Product configuration depends on personal experience.
- Price calculation is easy to make inconsistent.
- Discount approval is hard to trace.
- Quote documents are manually edited and error-prone.
- Historical versions are not easy to compare.
- Accepted quotes are difficult to convert into structured order data.

The CPQ system solves these issues by making quotation rules, pricing, approvals, and documents standardized.

## 3. Core Business Flow

```text
Customer
  -> Opportunity
  -> Quote Draft
  -> Product Configuration
  -> Price Calculation
  -> Discount and Margin Check
  -> Approval
  -> Quote Export
  -> Customer Accepted
  -> Order Conversion
```

## 4. Main Modules

| Module | Description |
| --- | --- |
| Customer Management | Customer, contact, owner, and quote history |
| Opportunity Management | Sales opportunity and quote relationship |
| Product Management | Product catalog, SKU, categories, options, and bundles |
| Configuration Rules | Required, excluded, dependent, quantity, and region rules |
| Price Management | Price books, tiered prices, discounts, taxes, and fees |
| Quote Management | Quote creation, calculation, versioning, status management |
| Approval Center | Discount, margin, amount, and manual price approvals |
| Document Export | PDF and Excel quote outputs |
| Order Management | Convert accepted quotes into orders |
| System Settings | Users, roles, permissions, numbering, and templates |

## 5. First Version Scope

The first version should be practical and controlled:

- Login and permissions
- Customer and contact management
- Product and option management
- Price book management
- Quote editor
- Backend price calculation
- Discount and margin approval
- Quote PDF export
- Quote version snapshots
- Basic audit logs

This version is enough to support a complete sales quotation workflow.

## 6. Recommended Technical Plan

| Layer | Recommended Choice |
| --- | --- |
| Frontend | React + TypeScript + Ant Design |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Export | Puppeteer for PDF, ExcelJS for Excel |
| Auth | JWT + RBAC |
| Deployment | Docker Compose |

This stack is suitable for one full-stack developer because it is efficient, structured, and easy to maintain.

## 7. Delivery Estimate

| Phase | Duration | Goal |
| --- | --- | --- |
| Phase 1 | 6 to 8 weeks | Usable MVP for quote creation, pricing, approval, and export |
| Phase 2 | 4 to 6 weeks | Better rules, bundle products, Excel import/export, order conversion |
| Phase 3 | 6 to 10 weeks | CRM/ERP integration, multi-currency, workflow designer, analytics |

## 8. Main Success Criteria

- Sales can finish a valid quotation without manual Excel calculation.
- Product configuration errors can be detected before approval.
- Discounts and low margin quotes trigger approval automatically.
- Approved quote versions are locked and traceable.
- Customer-facing quote documents can be exported from the system.
- Accepted quotes can become structured order records.

## 9. Implementation Priority

The most important engineering principle is to make backend quote calculation the only source of truth.

Recommended build order:

1. Authentication and permissions
2. Customer and product master data
3. Price book and price items
4. Quote editor
5. Quote calculation service
6. Approval workflow
7. Quote export
8. Version snapshots and audit logs

## 10. Key Risks

| Risk | Control Method |
| --- | --- |
| Product configuration rules become too complex | Start with fixed rule types |
| Price results differ between frontend and backend | Backend calculation is authoritative |
| Approval logic is unclear | Define thresholds before development |
| Quote documents change frequently | Use replaceable templates |
| Users want every ERP/CRM feature immediately | Reserve integration interfaces, implement later |

## 11. Conclusion

The CPQ system should be delivered as a quote-centered sales platform. The first version does not need to be overly abstract. It should focus on accurate product configuration, reliable price calculation, traceable approvals, and clean quote document generation.

Once the MVP is stable, the system can gradually evolve into a complete commercial middle platform connected to CRM, ERP, contract, and order systems.
