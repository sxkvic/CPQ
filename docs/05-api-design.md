# CPQ API Design

## 1. API Style

- Use REST APIs.
- Use JSON request and response bodies.
- Use JWT bearer authentication.
- Use pagination for list APIs.
- Use explicit action endpoints for status transitions.

Base path:

```text
/api/v1
```

Common response:

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

Common pagination response:

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

## 2. Auth APIs

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| POST | `/auth/refresh` | Refresh token |
| GET | `/auth/me` | Current user profile |
| POST | `/auth/change-password` | Change password |

Login request:

```json
{
  "username": "sales01",
  "password": "password"
}
```

## 3. Customer APIs

| Method | Path | Description |
| --- | --- | --- |
| GET | `/customers` | List customers |
| POST | `/customers` | Create customer |
| GET | `/customers/{id}` | Get customer detail |
| PUT | `/customers/{id}` | Update customer |
| DELETE | `/customers/{id}` | Disable customer |
| GET | `/customers/{id}/contacts` | List contacts |
| POST | `/customers/{id}/contacts` | Create contact |
| GET | `/customers/{id}/quotes` | List customer quotes |

Customer create request:

```json
{
  "name": "ABC Manufacturing Co., Ltd.",
  "industry": "Manufacturing",
  "region": "East China",
  "grade": "A",
  "taxNumber": "91300000000000000X",
  "billingAddress": "Shanghai",
  "ownerId": "uuid"
}
```

## 4. Opportunity APIs

| Method | Path | Description |
| --- | --- | --- |
| GET | `/opportunities` | List opportunities |
| POST | `/opportunities` | Create opportunity |
| GET | `/opportunities/{id}` | Get detail |
| PUT | `/opportunities/{id}` | Update |
| POST | `/opportunities/{id}/close-won` | Mark won |
| POST | `/opportunities/{id}/close-lost` | Mark lost |

## 5. Product APIs

| Method | Path | Description |
| --- | --- | --- |
| GET | `/product-categories` | List categories |
| POST | `/product-categories` | Create category |
| PUT | `/product-categories/{id}` | Update category |
| GET | `/products` | List products |
| POST | `/products` | Create product |
| GET | `/products/{id}` | Get product detail |
| PUT | `/products/{id}` | Update product |
| POST | `/products/{id}/activate` | Activate product |
| POST | `/products/{id}/deactivate` | Deactivate product |
| GET | `/products/{id}/options` | List options |
| POST | `/products/{id}/options` | Create option |
| PUT | `/product-options/{id}` | Update option |
| POST | `/products/{id}/bundle-items` | Add bundle item |

Product create request:

```json
{
  "categoryId": "uuid",
  "sku": "EQ-1000",
  "name": "Standard Equipment 1000",
  "productType": "physical",
  "unit": "set",
  "standardCost": 60000,
  "standardPrice": 100000,
  "description": "Standard equipment model"
}
```

## 6. Configuration APIs

| Method | Path | Description |
| --- | --- | --- |
| GET | `/configuration-rules` | List rules |
| POST | `/configuration-rules` | Create rule |
| PUT | `/configuration-rules/{id}` | Update rule |
| POST | `/configuration/validate` | Validate selected configuration |

Validation request:

```json
{
  "customerId": "uuid",
  "productId": "uuid",
  "quantity": 2,
  "selectedOptions": [
    {
      "optionId": "uuid",
      "valueIds": ["uuid"]
    }
  ]
}
```

Validation response:

```json
{
  "success": true,
  "data": {
    "valid": false,
    "messages": [
      {
        "severity": "error",
        "message": "High-power module requires upgraded cooling option."
      }
    ],
    "optionPriceDelta": 5000
  }
}
```

## 7. Pricing APIs

| Method | Path | Description |
| --- | --- | --- |
| GET | `/price-books` | List price books |
| POST | `/price-books` | Create price book |
| GET | `/price-books/{id}` | Get detail |
| PUT | `/price-books/{id}` | Update |
| POST | `/price-books/{id}/items` | Add price item |
| PUT | `/price-book-items/{id}` | Update price item |
| GET | `/discount-rules` | List discount rules |
| POST | `/discount-rules` | Create discount rule |
| GET | `/tax-rules` | List tax rules |
| POST | `/tax-rules` | Create tax rule |
| POST | `/pricing/preview` | Preview product price |

Pricing preview request:

```json
{
  "customerId": "uuid",
  "priceBookId": "uuid",
  "productId": "uuid",
  "quantity": 10,
  "selectedOptions": []
}
```

## 8. Quote APIs

| Method | Path | Description |
| --- | --- | --- |
| GET | `/quotes` | List quotes |
| POST | `/quotes` | Create quote |
| GET | `/quotes/{id}` | Get quote detail |
| PUT | `/quotes/{id}` | Update quote header |
| DELETE | `/quotes/{id}` | Cancel draft quote |
| POST | `/quotes/{id}/items` | Add quote item |
| PUT | `/quote-items/{id}` | Update quote item |
| DELETE | `/quote-items/{id}` | Remove quote item |
| POST | `/quotes/{id}/calculate` | Recalculate quote |
| POST | `/quotes/{id}/submit` | Submit for approval |
| POST | `/quotes/{id}/withdraw` | Withdraw approval |
| POST | `/quotes/{id}/mark-sent` | Mark as sent |
| POST | `/quotes/{id}/mark-accepted` | Mark as accepted |
| POST | `/quotes/{id}/mark-rejected` | Mark as rejected |
| POST | `/quotes/{id}/new-version` | Create new quote version |
| POST | `/quotes/{id}/duplicate` | Duplicate quote |
| GET | `/quotes/{id}/versions` | List quote versions |
| GET | `/quotes/{id}/approvals` | List approval records |

Create quote request:

```json
{
  "customerId": "uuid",
  "contactId": "uuid",
  "opportunityId": "uuid",
  "priceBookId": "uuid",
  "validUntil": "2026-06-30",
  "paymentTerms": "30% advance payment, 70% before shipment",
  "deliveryTerms": "Delivery within 30 working days"
}
```

Add quote item request:

```json
{
  "productId": "uuid",
  "quantity": 2,
  "selectedOptions": [
    {
      "optionId": "uuid",
      "valueIds": ["uuid"]
    }
  ],
  "discountRate": 0.1
}
```

Calculate response:

```json
{
  "success": true,
  "data": {
    "subtotalAmount": 180000,
    "discountAmount": 10000,
    "serviceFee": 5000,
    "shippingFee": 3000,
    "taxAmount": 23140,
    "totalAmount": 201140,
    "totalCost": 120000,
    "grossMarginRate": 0.4034,
    "approvalRequired": true,
    "approvalReasons": [
      "Line discount exceeds 20%"
    ]
  }
}
```

## 9. Approval APIs

| Method | Path | Description |
| --- | --- | --- |
| GET | `/approvals/tasks` | List my approval tasks |
| GET | `/approvals/{id}` | Get approval detail |
| POST | `/approvals/{id}/approve` | Approve |
| POST | `/approvals/{id}/reject` | Reject |
| POST | `/approvals/{id}/comment` | Add comment |

Approval request:

```json
{
  "comment": "Approved with special project reason."
}
```

## 10. Export APIs

| Method | Path | Description |
| --- | --- | --- |
| GET | `/quotes/{id}/export/pdf` | Export quote PDF |
| GET | `/quotes/{id}/export/excel` | Export quote Excel |
| GET | `/attachments/{id}/download` | Download attachment |

## 11. Order APIs

| Method | Path | Description |
| --- | --- | --- |
| POST | `/quotes/{id}/convert-to-order` | Convert accepted quote to order |
| GET | `/orders` | List orders |
| GET | `/orders/{id}` | Get order detail |
| POST | `/orders/{id}/push-to-erp` | Reserved ERP push action |
