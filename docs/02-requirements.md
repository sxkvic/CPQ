# CPQ Requirements

## 1. Functional Modules

### 1.1 Authentication and Authorization

- User login and logout.
- Password reset or admin password initialization.
- Role-based access control.
- Optional department or team-level data scope.
- Operation audit for sensitive actions.

Recommended roles:

| Role | Permission Summary |
| --- | --- |
| Admin | Full system management |
| Sales | Manage own customers, opportunities, and quotes |
| Sales Manager | Manage team quotes and approvals |
| Product Manager | Manage products, options, bundles, and configuration rules |
| Pricing Manager | Manage price books, discounts, and tax rules |
| Finance | View quote financials and approve margin-related requests |
| Executive | Approve large or exceptional quotes |

### 1.2 Customer Management

- Create, edit, disable, and search customers.
- Manage customer contacts.
- Assign customer owner.
- Store customer grade, industry, region, and tax information.
- View customer quote history.

### 1.3 Opportunity Management

- Create opportunity under customer.
- Track sales stage, expected close date, owner, estimated amount.
- Link multiple quote versions to one opportunity.
- Convert accepted quote to order.

### 1.4 Product Catalog

- Manage product categories.
- Manage products and SKUs.
- Support physical products, software, services, and implementation items.
- Product fields:
  - Code
  - Name
  - Category
  - Description
  - Unit
  - Standard cost
  - Standard price
  - Status
  - Effective date
  - Expiration date

### 1.5 Product Configuration

- Configure product options.
- Support required options and optional add-ons.
- Support option value price adjustment.
- Support bundles and package products.
- Support basic validation:
  - Required option missing
  - Mutually exclusive options
  - Dependent options
  - Minimum or maximum quantity
  - Region or customer restriction

### 1.6 Pricing

- Maintain price books by region, customer type, channel, or date.
- Maintain price book items for products and options.
- Support:
  - Standard price
  - Customer group price
  - Tiered quantity price
  - Option price adjustment
  - Manual discount
  - Auto discount
  - Tax rate
  - Service fee
  - Shipping fee

### 1.7 Quote Management

- Create quote from customer or opportunity.
- Add products and bundles.
- Configure product options.
- Calculate line and total prices.
- Apply line-level and quote-level discounts.
- Save draft.
- Submit approval.
- Generate customer-facing quote document.
- Duplicate quote.
- Create new quote version.
- Mark quote as accepted, rejected, canceled, or expired.

Quote statuses:

```text
Draft -> Pending Approval -> Approved -> Sent -> Accepted -> Converted
Draft -> Canceled
Pending Approval -> Rejected -> Draft
Approved -> Expired
Sent -> Rejected
```

### 1.8 Quote Calculation

Line calculation:

```text
base_amount = unit_price * quantity
option_amount = sum(option_price_adjustments)
line_list_amount = base_amount + option_amount
line_discount_amount = line_list_amount * line_discount_rate
line_net_amount = line_list_amount - line_discount_amount
```

Quote calculation:

```text
subtotal = sum(line_net_amount)
quote_discount_amount = subtotal * quote_discount_rate
taxable_amount = subtotal - quote_discount_amount + service_fee + shipping_fee
tax_amount = taxable_amount * tax_rate
total_amount = taxable_amount + tax_amount
gross_profit = total_amount - total_cost
gross_margin_rate = gross_profit / total_amount
```

### 1.9 Approval Workflow

Approval should be rule-driven but simple in MVP.

Trigger examples:

| Condition | Approver |
| --- | --- |
| Any line discount > 20% | Sales Manager |
| Quote discount > 15% | Sales Manager |
| Quote discount > 30% | Executive |
| Gross margin rate < 15% | Finance |
| Total amount > 1,000,000 | Executive |
| Manual price override | Pricing Manager |

Approval actions:

- Submit
- Approve
- Reject
- Withdraw
- Re-submit

Approval record should include:

- Trigger reason
- Current approver
- Approval level
- Comment
- Timestamp
- Before and after status

### 1.10 Export and Document Generation

MVP export formats:

- PDF quote
- Excel quote detail

Quote document content:

- Company logo and seller information
- Customer name and contact
- Quote number and version
- Valid until date
- Product lines
- Quantity, unit price, discount, tax, total
- Payment terms
- Delivery terms
- Remarks
- Signature area

### 1.11 Order Conversion

- Accepted quote can be converted into order.
- Converted quote should be locked.
- Order should inherit customer, contact, quote items, price, and terms.
- Later integration can push order data to ERP.

### 1.12 Audit Logs

Audit these actions:

- Login failure
- Price change
- Product rule change
- Quote submission
- Quote approval
- Manual price override
- Quote export
- Quote status change

## 2. Non-Functional Requirements

### 2.1 Performance

- Quote list should load within 2 seconds for common filters.
- Quote calculation should complete within 1 second for normal quotes.
- Product search should support keyword and category filters.

### 2.2 Security

- Passwords must be hashed.
- JWT or session token should expire.
- Sensitive APIs must check role and data ownership.
- Financial fields should be hidden from users without permission.

### 2.3 Maintainability

- Price calculation should be centralized in backend service.
- Approval triggers should be configurable.
- Product rules should be data-driven where possible.
- Export template should be replaceable.

### 2.4 Traceability

- Approved and sent quote versions should not be edited directly.
- New changes should create a new quote version.
- Approval records and quote snapshots must be retained.
