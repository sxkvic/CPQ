# CPQ System Design

This directory contains a complete first-version design for a CPQ system.

CPQ means Configure, Price, Quote. The system helps sales teams configure complex products, calculate prices, manage discounts and approvals, and generate customer-facing quotations.

## Documents

- [01 Overview](./01-overview.md): product positioning, users, scope, and core workflow.
- [02 Requirements](./02-requirements.md): functional requirements, roles, permissions, and business rules.
- [03 Architecture](./03-architecture.md): frontend, backend, database, deployment, and integration design.
- [04 Data Model](./04-data-model.md): main entities, table design, and state machines.
- [05 API Design](./05-api-design.md): REST API draft for core modules.
- [06 Frontend Design](./06-frontend-design.md): menus, pages, interactions, and component structure.
- [07 Delivery Roadmap](./07-delivery-roadmap.md): MVP scope, milestones, risks, and acceptance criteria.

## Recommended MVP

The first usable version should include:

- Login and role-based access control
- Customer and contact management
- Product and option management
- Price book and discount management
- Quote creation and automatic calculation
- Quote versioning
- Simple approval flow
- PDF or Excel export
- Basic audit logs

Advanced rule engine, ERP/CRM integration, multi-currency, and complex margin analysis can be added after the MVP is stable.
