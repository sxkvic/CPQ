# CPQ Frontend Design

## 1. Information Architecture

Recommended main navigation:

```text
Dashboard
Customers
Opportunities
Products
Configuration Rules
Pricing
Quotes
Approvals
Orders
Reports
System Settings
```

For MVP, Reports can be a simple dashboard instead of a full analytics module.

## 2. Layout

Use a standard enterprise layout:

- Left sidebar navigation.
- Top bar with search, current user, and notifications.
- Main content area.
- Drawer or modal for quick creation.
- Detail pages with tabs.

Recommended quote page layout:

```text
Quote Header
  Customer, Contact, Opportunity, Valid Until, Status

Quote Workspace
  Left: Product search and category filter
  Center: Quote line items
  Right: Calculation summary and approval hints

Footer Actions
  Save Draft, Calculate, Submit Approval, Export, Mark Sent
```

## 3. Page List

### 3.1 Login

Fields:

- Username
- Password

Actions:

- Login
- Remember account

### 3.2 Dashboard

Cards:

- My draft quotes
- Pending approval quotes
- Approved this month
- Accepted amount this month
- Expiring quotes

Tables:

- Recent quotes
- My approval tasks

### 3.3 Customer List

Filters:

- Keyword
- Region
- Industry
- Grade
- Owner
- Status

Columns:

- Customer code
- Customer name
- Region
- Grade
- Owner
- Quote count
- Last quote date
- Status

Actions:

- Create customer
- View detail
- Edit
- Disable

### 3.4 Customer Detail

Tabs:

- Basic information
- Contacts
- Opportunities
- Quotes
- Attachments
- Activity logs

### 3.5 Opportunity List

Filters:

- Keyword
- Customer
- Stage
- Owner
- Expected close date

Columns:

- Opportunity name
- Customer
- Stage
- Estimated amount
- Expected close date
- Owner
- Latest quote

### 3.6 Product List

Filters:

- Keyword
- Category
- Product type
- Status

Columns:

- SKU
- Product name
- Category
- Type
- Unit
- Standard price
- Standard cost
- Status

Actions:

- Create product
- Edit
- Activate
- Deactivate
- Manage options
- Manage bundle items

### 3.7 Product Detail

Tabs:

- Basic information
- Options
- Bundle items
- Configuration rules
- Price book records
- Change history

### 3.8 Configuration Rules

List columns:

- Rule code
- Rule name
- Product
- Type
- Severity
- Status

Rule form:

- Product scope
- Rule type
- Condition builder
- Action builder
- Message
- Severity

MVP can use structured forms and store JSON internally.

### 3.9 Pricing

Pages:

- Price book list
- Price book detail
- Discount rules
- Tax rules

Price book detail:

- Basic information
- Product price items
- Quantity tiers
- Effective period

### 3.10 Quote List

Filters:

- Keyword
- Quote status
- Customer
- Owner
- Amount range
- Created date
- Valid until

Columns:

- Quote number
- Version
- Customer
- Opportunity
- Owner
- Total amount
- Gross margin rate
- Status
- Valid until
- Updated time

Actions:

- Create quote
- Duplicate
- New version
- Export
- View approval

### 3.11 Quote Editor

Quote editor is the most important page.

Header fields:

- Customer
- Contact
- Opportunity
- Price book
- Currency
- Valid until
- Payment terms
- Delivery terms

Line item table:

- Line number
- Product
- Configuration summary
- Quantity
- Unit
- Unit price
- Discount
- Net amount
- Tax
- Total
- Actions

Right summary:

- Subtotal
- Quote discount
- Service fee
- Shipping fee
- Tax
- Total amount
- Total cost
- Gross margin rate
- Approval required
- Approval reasons

Actions:

- Add product
- Add bundle
- Configure
- Calculate
- Save draft
- Submit approval
- Export PDF
- Export Excel

### 3.12 Product Configuration Drawer

Content:

- Product basic info
- Required options
- Optional add-ons
- Quantity
- Validation result
- Price adjustment preview

Option controls:

- Single select for exclusive option groups.
- Checkbox group for multiple add-ons.
- Number input for numeric options.
- Text input for remarks or custom specs.

Validation messages:

- Error messages block saving.
- Warning messages allow saving but should be shown clearly.

### 3.13 Approval Center

Tabs:

- My pending tasks
- Submitted by me
- Processed by me
- All approvals, for managers or admins

Approval detail:

- Quote snapshot
- Trigger reasons
- Price and margin summary
- Approval timeline
- Comment box
- Approve and reject actions

### 3.14 Order List

Columns:

- Order number
- Source quote
- Customer
- Total amount
- Status
- Created time

Actions:

- View detail
- Push to ERP, reserved

### 3.15 System Settings

Pages:

- Users
- Roles
- Permissions
- Departments
- Number rules
- Company information
- Quote template

## 4. Frontend State Design

Server state:

- Customers
- Products
- Price books
- Quotes
- Approvals

Use TanStack Query for loading, caching, and mutation.

Local state:

- Current quote editor draft
- Product configuration drawer state
- Unsaved line item changes
- Table filters

Use component state or Zustand for complex quote editor state.

## 5. Quote Editor Interaction Details

### 5.1 Create Quote

1. User selects customer.
2. System loads contacts and opportunities.
3. User selects price book.
4. System creates draft quote.
5. User enters quote editor.

### 5.2 Add Product

1. User searches product.
2. User selects product.
3. If product has options, open configuration drawer.
4. User selects options.
5. Frontend calls validation API.
6. If valid, add line item.
7. Quote recalculates.

### 5.3 Submit Approval

1. User clicks submit.
2. Frontend calls calculate API first.
3. Backend returns approval requirement.
4. User confirms submission.
5. Backend creates approval task.
6. Quote status changes to pending approval.

### 5.4 Edit Approved Quote

Approved and sent quotes should be locked.

If user needs changes:

1. Click create new version.
2. System duplicates current snapshot.
3. New version starts as draft.

## 6. Component Suggestions

Shared components:

- `MoneyText`
- `StatusTag`
- `UserSelect`
- `CustomerSelect`
- `ProductSelect`
- `PriceBookSelect`
- `QuoteStatusTag`
- `ApprovalTimeline`
- `ProductConfigDrawer`
- `QuoteSummaryPanel`
- `EditableQuoteItemTable`
- `AuditLogTable`

## 7. UX Rules

- Show quote calculation result immediately after line changes.
- Always display the current quote status.
- Disable invalid status actions.
- Explain approval reasons in plain language.
- Warn before leaving quote editor with unsaved changes.
- Keep financial fields aligned and formatted.
- Use customer-facing PDF preview before export if possible.
