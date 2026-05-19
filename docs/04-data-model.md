# CPQ Data Model

## 1. Entity Relationship Summary

```text
User -> Role -> Permission

Customer -> Contact
Customer -> Opportunity -> Quote

ProductCategory -> Product
Product -> ProductOption -> ProductOptionValue
Product -> ProductBundleItem -> Product
Product -> ConfigurationRule

PriceBook -> PriceBookItem -> Product
DiscountRule
TaxRule

Quote -> QuoteItem
Quote -> QuoteVersion
Quote -> QuoteApproval -> QuoteApprovalLog
Quote -> Attachment
Quote -> Order

AuditLog
```

## 2. Core Tables

### 2.1 users

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| username | varchar | Unique |
| password_hash | varchar | Hashed password |
| display_name | varchar | User name |
| email | varchar | Optional |
| phone | varchar | Optional |
| department_id | uuid | Optional |
| status | varchar | active, disabled |
| created_at | timestamp |  |
| updated_at | timestamp |  |

### 2.2 roles

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| code | varchar | Unique |
| name | varchar |  |
| description | text | Optional |

### 2.3 customers

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| code | varchar | Unique customer code |
| name | varchar | Customer name |
| industry | varchar | Optional |
| region | varchar | Optional |
| grade | varchar | A/B/C or custom |
| tax_number | varchar | Optional |
| billing_address | text | Optional |
| owner_id | uuid | Sales owner |
| status | varchar | active, disabled |
| created_at | timestamp |  |
| updated_at | timestamp |  |

### 2.4 contacts

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| customer_id | uuid | Foreign key |
| name | varchar |  |
| title | varchar | Optional |
| phone | varchar | Optional |
| email | varchar | Optional |
| is_primary | boolean |  |

### 2.5 opportunities

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| customer_id | uuid | Foreign key |
| name | varchar |  |
| stage | varchar | lead, qualified, proposal, negotiation, won, lost |
| expected_close_date | date | Optional |
| estimated_amount | decimal | Optional |
| owner_id | uuid | Sales owner |
| status | varchar | active, closed |
| created_at | timestamp |  |
| updated_at | timestamp |  |

## 3. Product Tables

### 3.1 product_categories

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| parent_id | uuid | Optional tree parent |
| code | varchar | Unique |
| name | varchar |  |
| sort_order | int |  |
| status | varchar | active, disabled |

### 3.2 products

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| category_id | uuid | Foreign key |
| sku | varchar | Unique |
| name | varchar |  |
| product_type | varchar | physical, software, service, bundle |
| unit | varchar | set, item, year, hour |
| description | text | Optional |
| standard_cost | decimal | Optional but recommended |
| standard_price | decimal |  |
| status | varchar | draft, active, inactive |
| effective_at | timestamp | Optional |
| expired_at | timestamp | Optional |
| created_at | timestamp |  |
| updated_at | timestamp |  |

### 3.3 product_options

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| product_id | uuid | Foreign key |
| code | varchar |  |
| name | varchar |  |
| option_type | varchar | single, multiple, number, text |
| is_required | boolean |  |
| sort_order | int |  |
| status | varchar | active, disabled |

### 3.4 product_option_values

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| option_id | uuid | Foreign key |
| code | varchar |  |
| label | varchar |  |
| price_delta | decimal | Option price adjustment |
| cost_delta | decimal | Option cost adjustment |
| is_default | boolean |  |
| sort_order | int |  |

### 3.5 product_bundle_items

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| bundle_product_id | uuid | Parent bundle |
| child_product_id | uuid | Included product |
| min_quantity | int |  |
| default_quantity | int |  |
| max_quantity | int | Optional |
| is_required | boolean |  |

### 3.6 configuration_rules

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| product_id | uuid | Rule scope |
| code | varchar | Unique |
| name | varchar |  |
| rule_type | varchar | require, exclude, quantity, region |
| condition_json | jsonb | Trigger condition |
| action_json | jsonb | Validation action |
| message | varchar | Human-readable reason |
| severity | varchar | error, warning |
| status | varchar | active, disabled |

## 4. Pricing Tables

### 4.1 price_books

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| code | varchar | Unique |
| name | varchar |  |
| currency | varchar | CNY, USD, EUR |
| region | varchar | Optional |
| customer_grade | varchar | Optional |
| channel | varchar | Optional |
| effective_at | timestamp |  |
| expired_at | timestamp | Optional |
| status | varchar | active, disabled |

### 4.2 price_book_items

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| price_book_id | uuid | Foreign key |
| product_id | uuid | Foreign key |
| option_value_id | uuid | Optional |
| min_quantity | int | Default 1 |
| max_quantity | int | Optional |
| unit_price | decimal |  |
| cost_price | decimal | Optional |

### 4.3 discount_rules

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| code | varchar | Unique |
| name | varchar |  |
| scope | varchar | line, quote |
| condition_json | jsonb | Customer, product, amount, quantity |
| discount_type | varchar | percentage, amount |
| discount_value | decimal |  |
| requires_approval | boolean |  |
| status | varchar | active, disabled |

### 4.4 tax_rules

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| region | varchar |  |
| product_type | varchar | Optional |
| tax_rate | decimal | Example: 0.13 |
| status | varchar | active, disabled |

## 5. Quote Tables

### 5.1 quotes

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| quote_no | varchar | Unique |
| version | int | Current version number |
| customer_id | uuid | Foreign key |
| contact_id | uuid | Optional |
| opportunity_id | uuid | Optional |
| owner_id | uuid | Sales owner |
| price_book_id | uuid | Foreign key |
| currency | varchar |  |
| status | varchar | draft, pending_approval, approved, sent, accepted, rejected, expired, canceled, converted |
| valid_until | date |  |
| subtotal_amount | decimal |  |
| discount_amount | decimal |  |
| service_fee | decimal |  |
| shipping_fee | decimal |  |
| tax_amount | decimal |  |
| total_amount | decimal |  |
| total_cost | decimal |  |
| gross_margin_rate | decimal |  |
| payment_terms | text | Optional |
| delivery_terms | text | Optional |
| remarks | text | Optional |
| submitted_at | timestamp | Optional |
| approved_at | timestamp | Optional |
| sent_at | timestamp | Optional |
| created_at | timestamp |  |
| updated_at | timestamp |  |

### 5.2 quote_items

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| quote_id | uuid | Foreign key |
| parent_item_id | uuid | For bundle child items |
| product_id | uuid | Foreign key |
| line_no | int | Display order |
| product_name_snapshot | varchar | Snapshot |
| sku_snapshot | varchar | Snapshot |
| quantity | decimal |  |
| unit | varchar | Snapshot |
| unit_price | decimal |  |
| cost_price | decimal |  |
| option_config_json | jsonb | Selected options snapshot |
| list_amount | decimal |  |
| discount_rate | decimal |  |
| discount_amount | decimal |  |
| net_amount | decimal |  |
| tax_rate | decimal |  |
| tax_amount | decimal |  |
| total_amount | decimal |  |

### 5.3 quote_versions

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| quote_id | uuid | Foreign key |
| version | int |  |
| snapshot_json | jsonb | Full quote snapshot |
| change_note | text | Optional |
| created_by | uuid | User |
| created_at | timestamp |  |

### 5.4 quote_approvals

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| quote_id | uuid | Foreign key |
| status | varchar | pending, approved, rejected, withdrawn |
| current_step | int |  |
| trigger_reasons_json | jsonb | Reasons |
| submitted_by | uuid | User |
| submitted_at | timestamp |  |
| completed_at | timestamp | Optional |

### 5.5 quote_approval_logs

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| approval_id | uuid | Foreign key |
| step | int |  |
| approver_id | uuid | User |
| action | varchar | approve, reject, comment |
| comment | text | Optional |
| created_at | timestamp |  |

## 6. Other Tables

### 6.1 orders

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| order_no | varchar | Unique |
| quote_id | uuid | Foreign key |
| customer_id | uuid | Foreign key |
| status | varchar | created, confirmed, pushed_to_erp, canceled |
| total_amount | decimal |  |
| created_at | timestamp |  |

### 6.2 attachments

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| owner_type | varchar | quote, product, customer |
| owner_id | uuid |  |
| file_name | varchar |  |
| file_path | varchar |  |
| file_type | varchar |  |
| uploaded_by | uuid | User |
| created_at | timestamp |  |

### 6.3 audit_logs

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| actor_id | uuid | User |
| action | varchar |  |
| resource_type | varchar |  |
| resource_id | uuid | Optional |
| before_json | jsonb | Optional |
| after_json | jsonb | Optional |
| ip_address | varchar | Optional |
| created_at | timestamp |  |

## 7. Index Recommendations

- `users.username`
- `customers.code`
- `customers.name`
- `customers.owner_id`
- `products.sku`
- `products.category_id`
- `quotes.quote_no`
- `quotes.customer_id`
- `quotes.opportunity_id`
- `quotes.owner_id`
- `quotes.status`
- `quote_items.quote_id`
- `quote_approvals.quote_id`
- `audit_logs.resource_type, audit_logs.resource_id`
