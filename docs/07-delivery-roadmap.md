# CPQ Delivery Roadmap

## 1. Recommended Delivery Strategy

Build the system in three phases:

```text
Phase 1: MVP that can create and approve quotes
Phase 2: Stronger configuration, pricing, and document generation
Phase 3: Integration, analytics, and advanced automation
```

The first delivery should prioritize quote creation and price correctness. Product rules can start simple and become more powerful later.

## 2. Phase 1 MVP

Estimated duration for one full-stack developer: 6 to 8 weeks.

### Scope

- Project scaffolding
- Login and RBAC
- Customer management
- Contact management
- Product category and product management
- Basic product options
- Price book and price items
- Quote creation
- Quote item management
- Backend quote calculation
- Manual discount
- Approval trigger evaluation
- One or two-level approval workflow
- Quote PDF export
- Quote version snapshot
- Basic audit logs

### Acceptance Criteria

- Sales can create a customer and contact.
- Product manager can maintain products and options.
- Pricing manager can maintain a price book.
- Sales can create a quote and add products.
- System calculates subtotal, discount, tax, total, cost, and margin.
- System blocks invalid product configuration.
- System requires approval when discount or margin rules are triggered.
- Approver can approve or reject quote.
- Approved quote can be exported as PDF.
- Approved quote cannot be edited directly.
- User can create a new version from an approved quote.

## 3. Phase 2 Enhancement

Estimated duration: 4 to 6 weeks.

### Scope

- Bundle product support
- Quantity tier pricing
- More flexible configuration rules
- Quote Excel export
- Quote template management
- Approval timeline and comments
- Order conversion
- Expiring quote reminders
- Import products and prices from Excel
- Better dashboard

### Acceptance Criteria

- Bundle products can include required and optional child products.
- Quantity changes can use tiered prices.
- Product rules can express dependency and exclusion.
- Quote can be exported to Excel.
- Accepted quote can be converted into order.
- Users can import product and price data from Excel.

## 4. Phase 3 Advanced Capabilities

Estimated duration: 6 to 10 weeks.

### Scope

- CRM integration
- ERP integration
- Multi-currency and exchange rate
- Channel partner quotation
- Advanced margin analysis
- Contract generation
- Electronic signature integration
- API webhook callbacks
- Configurable approval workflow designer
- Rule engine upgrade

## 5. Development Milestones

### Milestone 1: Foundation

Deliverables:

- Frontend and backend project scaffold
- Database schema and migrations
- Login
- User and role management
- Base layout

### Milestone 2: Master Data

Deliverables:

- Customers and contacts
- Product categories and products
- Product options
- Price books and price items

### Milestone 3: Quote Core

Deliverables:

- Quote list
- Quote editor
- Product configuration drawer
- Quote item table
- Backend calculation service
- Quote version snapshot

### Milestone 4: Approval and Export

Deliverables:

- Approval triggers
- Approval center
- Approve and reject actions
- PDF export
- Audit logs

### Milestone 5: Stabilization

Deliverables:

- Permission checks
- Error handling
- Seed demo data
- End-to-end testing
- Deployment scripts
- User guide

## 6. Risk List

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Product rules become too complex too early | Delays MVP | Start with simple rule types |
| Price calculation is implemented in multiple places | Inconsistent results | Backend calculation service is source of truth |
| Approved quotes are editable | Legal and commercial risk | Use quote snapshots and locked statuses |
| Approval requirements are unclear | Rework | Define discount, margin, and amount thresholds first |
| PDF template requirements change often | Rework | Build replaceable template structure |
| Product data quality is poor | Bad quotes | Add import validation and required fields |

## 7. Initial Demo Data

Use demo data for internal review:

Customers:

- ABC Manufacturing
- Star Energy
- Metro Automation

Products:

- Standard Equipment 1000
- Advanced Equipment 2000
- Installation Service
- Annual Maintenance Service
- Remote Monitoring Module

Options:

- Power level: Standard, High
- Cooling: Standard, Enhanced
- Warranty: 1 year, 2 years, 3 years
- Monitoring: None, Basic, Advanced

Rules:

- High power requires enhanced cooling.
- Advanced monitoring requires annual maintenance service.
- Discount above 20% requires sales manager approval.
- Gross margin below 15% requires finance approval.

## 8. Suggested First Sprint Backlog

1. Create repository structure.
2. Initialize backend project.
3. Initialize frontend project.
4. Create database schema.
5. Implement login.
6. Implement base layout.
7. Implement customer list and form.
8. Implement product list and form.
9. Implement price book list and form.
10. Seed demo users, customers, products, and prices.

## 9. Definition of Done

A feature is done when:

- API has validation and permission checks.
- Frontend handles loading, empty, error, and success states.
- Data is persisted correctly.
- Audit log is written for sensitive operations.
- Main happy path has been manually tested.
- Related seed data or test data is available.
- User-facing labels and statuses are understandable.

## 10. One-Person Development Advice

- Keep MVP workflows narrow.
- Do not build a fully generic rule engine in the first version.
- Make quote calculation service clean and heavily tested.
- Use Ant Design table, form, drawer, modal, and steps components to save time.
- Prefer PostgreSQL JSON fields for rule conditions and quote snapshots.
- Generate quote number and version number on the backend.
- Treat PDF export as a template output, not as frontend print styling.
