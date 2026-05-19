# CPQ System Overview

## 1. Product Positioning

The CPQ system is an internal sales enablement platform. It standardizes how sales users configure products, calculate prices, request discounts, generate quotations, and submit approvals.

The first version should be designed for a manufacturing, equipment, or solution-selling scenario. This model can later be adapted to SaaS subscriptions, engineering projects, service packages, or channel sales.

## 2. Business Goals

- Reduce manual quotation work.
- Prevent invalid product combinations.
- Standardize price calculation and discount control.
- Shorten quotation approval time.
- Keep quotation versions traceable.
- Provide structured data for CRM, ERP, contract, subscription, document, and order integration.

## 3. Target Users

| Role | Main Responsibilities |
| --- | --- |
| Sales | Create quotes, configure products, apply discounts, send quotes |
| Sales Manager | Review discount requests and team quotes |
| Product Manager | Maintain products, options, bundles, and configuration rules |
| Pricing Manager | Maintain price books, discount policies, and tax rules |
| Finance | Review margin, tax, and special price requests |
| Admin | Manage users, roles, permissions, and system settings |
| Executive Approver | Approve high-value or high-risk quotes |

## 4. Core Workflow

```text
Customer / Opportunity
  -> Create Quote
  -> Select Product
  -> Configure Options
  -> Validate Configuration Rules
  -> Calculate Price
  -> Apply Discount / Fees / Tax
  -> Submit Approval
  -> Generate Quote Document
  -> Send to Customer
  -> Accepted / Rejected / Expired
  -> Convert to Order
  -> Generate Contract
  -> Activate Subscription / Renewal
  -> Sync ERP / CRM / Finance
```

## 5. Scope

### MVP Scope

- User login and permissions
- Customer, contact, and opportunity management
- Product catalog
- Product options and bundles
- Simple configuration validation
- Price book
- Quote calculation
- Discount request
- Approval workflow
- Quote export and document templates
- Quote version history
- Audit logs
- Contract management
- Subscription and renewal management
- Outbound integration event queue

### Later Scope

- Full visual product configurator
- Complex rule engine
- Multi-currency and exchange rates
- Channel partner quoting
- Electronic signature
- Advanced profit analysis
- AI-assisted quote recommendation

## 6. Key Business Objects

| Object | Description |
| --- | --- |
| Customer | Company or organization receiving the quote |
| Contact | Person under a customer |
| Opportunity | Sales opportunity linked to one or more quotes |
| Product | Sellable item, service, or solution |
| Option | Configurable attribute or add-on |
| Bundle | Product package with required and optional items |
| Price Book | Pricing policy for a region, customer group, or channel |
| Quote | Commercial offer sent to a customer |
| Quote Item | One product line in a quote |
| Approval | Workflow record for discount, margin, or amount review |
| Order | Confirmed quote converted into execution record |
| Document Template | Reusable HTML template for quote or contract output |
| Quote Document | Generated quote document snapshot |
| Contract | Commercial agreement generated from accepted quote or order |
| Subscription | Recurring software or service entitlement with renewal tracking |
| Integration Endpoint | External system connection definition |
| Integration Event | Outbound event queued for ERP, CRM, or finance synchronization |

## 7. Recommended Product Principles

- The quote page should be the center of the system.
- Product and price maintenance should be simple enough for non-developers.
- Every calculated result should be explainable.
- Every approval should show the triggering reason.
- Quote versions must be immutable after approval or customer delivery.
- The MVP should favor clear workflows over highly abstract rule design.
