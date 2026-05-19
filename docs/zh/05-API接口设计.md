# CPQ API 接口设计

## 1. 接口风格

- 使用 REST API。
- 请求和响应使用 JSON。
- 使用 JWT Bearer Token 认证。
- 列表接口统一分页。
- 状态变化使用明确动作接口，不直接暴露任意改状态接口。

基础路径：

```text
/api/v1
```

通用响应：

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

分页响应：

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

## 2. 登录接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/auth/login` | 登录 |
| POST | `/auth/logout` | 退出登录 |
| POST | `/auth/refresh` | 刷新 Token |
| GET | `/auth/me` | 当前用户信息 |
| POST | `/auth/change-password` | 修改密码 |

登录请求：

```json
{
  "username": "sales01",
  "password": "password"
}
```

## 3. 客户接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/customers` | 查询客户列表 |
| POST | `/customers` | 新建客户 |
| GET | `/customers/{id}` | 查询客户详情 |
| PUT | `/customers/{id}` | 更新客户 |
| DELETE | `/customers/{id}` | 禁用客户 |
| GET | `/customers/{id}/contacts` | 查询联系人 |
| POST | `/customers/{id}/contacts` | 新建联系人 |
| GET | `/customers/{id}/quotes` | 查询客户报价历史 |

新建客户请求：

```json
{
  "name": "ABC制造有限公司",
  "industry": "制造业",
  "region": "华东",
  "grade": "A",
  "taxNumber": "91300000000000000X",
  "billingAddress": "上海市",
  "ownerId": "uuid"
}
```

## 4. 商机接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/opportunities` | 查询商机列表 |
| POST | `/opportunities` | 新建商机 |
| GET | `/opportunities/{id}` | 查询商机详情 |
| PUT | `/opportunities/{id}` | 更新商机 |
| POST | `/opportunities/{id}/close-won` | 标记赢单 |
| POST | `/opportunities/{id}/close-lost` | 标记输单 |

## 5. 产品接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/product-categories` | 查询产品分类 |
| POST | `/product-categories` | 新建产品分类 |
| PUT | `/product-categories/{id}` | 更新产品分类 |
| GET | `/products` | 查询产品列表 |
| POST | `/products` | 新建产品 |
| GET | `/products/{id}` | 查询产品详情 |
| PUT | `/products/{id}` | 更新产品 |
| POST | `/products/{id}/activate` | 启用产品 |
| POST | `/products/{id}/deactivate` | 停用产品 |
| GET | `/products/{id}/options` | 查询产品选项 |
| POST | `/products/{id}/options` | 新建产品选项 |
| PUT | `/product-options/{id}` | 更新产品选项 |
| POST | `/products/{id}/bundle-items` | 新增套餐子项 |

新建产品请求：

```json
{
  "categoryId": "uuid",
  "sku": "EQ-1000",
  "name": "标准设备1000",
  "productType": "physical",
  "unit": "套",
  "standardCost": 60000,
  "standardPrice": 100000,
  "description": "标准设备型号"
}
```

## 6. 配置接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/configuration-rules` | 查询配置规则 |
| POST | `/configuration-rules` | 新建配置规则 |
| PUT | `/configuration-rules/{id}` | 更新配置规则 |
| POST | `/configuration/validate` | 校验产品配置 |

配置校验请求：

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

配置校验响应：

```json
{
  "success": true,
  "data": {
    "valid": false,
    "messages": [
      {
        "severity": "error",
        "message": "高功率模块必须选择增强散热。"
      }
    ],
    "optionPriceDelta": 5000
  }
}
```

## 7. 价格接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/price-books` | 查询价格本 |
| POST | `/price-books` | 新建价格本 |
| GET | `/price-books/{id}` | 查询价格本详情 |
| PUT | `/price-books/{id}` | 更新价格本 |
| POST | `/price-books/{id}/items` | 新增价格明细 |
| PUT | `/price-book-items/{id}` | 更新价格明细 |
| GET | `/discount-rules` | 查询折扣规则 |
| POST | `/discount-rules` | 新建折扣规则 |
| GET | `/tax-rules` | 查询税率规则 |
| POST | `/tax-rules` | 新建税率规则 |
| POST | `/pricing/preview` | 价格预览 |

价格预览请求：

```json
{
  "customerId": "uuid",
  "priceBookId": "uuid",
  "productId": "uuid",
  "quantity": 10,
  "selectedOptions": []
}
```

## 8. 报价接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/quotes` | 查询报价列表 |
| POST | `/quotes` | 新建报价 |
| GET | `/quotes/{id}` | 查询报价详情 |
| PUT | `/quotes/{id}` | 更新报价头信息 |
| DELETE | `/quotes/{id}` | 取消草稿报价 |
| POST | `/quotes/{id}/items` | 新增报价明细 |
| PUT | `/quote-items/{id}` | 更新报价明细 |
| DELETE | `/quote-items/{id}` | 删除报价明细 |
| POST | `/quotes/{id}/calculate` | 重新计算报价 |
| POST | `/quotes/{id}/submit` | 提交审批 |
| POST | `/quotes/{id}/withdraw` | 撤回审批 |
| POST | `/quotes/{id}/mark-sent` | 标记已发送 |
| POST | `/quotes/{id}/mark-accepted` | 标记已接受 |
| POST | `/quotes/{id}/mark-rejected` | 标记已拒绝 |
| POST | `/quotes/{id}/new-version` | 创建新版本 |
| POST | `/quotes/{id}/duplicate` | 复制报价 |
| GET | `/quotes/{id}/versions` | 查询报价版本 |
| GET | `/quotes/{id}/approvals` | 查询审批记录 |

新建报价请求：

```json
{
  "customerId": "uuid",
  "contactId": "uuid",
  "opportunityId": "uuid",
  "priceBookId": "uuid",
  "validUntil": "2026-06-30",
  "paymentTerms": "预付30%，发货前付70%",
  "deliveryTerms": "30个工作日内交付"
}
```

新增报价明细请求：

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

报价计算响应：

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
      "明细行折扣超过20%"
    ]
  }
}
```

## 9. 审批接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/approvals/tasks` | 查询我的审批任务 |
| GET | `/approvals/{id}` | 查询审批详情 |
| POST | `/approvals/{id}/approve` | 审批通过 |
| POST | `/approvals/{id}/reject` | 审批驳回 |
| POST | `/approvals/{id}/comment` | 添加审批意见 |

审批请求：

```json
{
  "comment": "基于重点项目原因，同意本次特殊折扣。"
}
```

## 10. 导出接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/quotes/{id}/export/pdf` | 导出 PDF 报价单 |
| GET | `/quotes/{id}/export/excel` | 导出 Excel 报价明细 |
| GET | `/attachments/{id}/download` | 下载附件 |

## 11. 订单接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/quotes/{id}/convert-to-order` | 报价转订单 |
| GET | `/orders` | 查询订单列表 |
| GET | `/orders/{id}` | 查询订单详情 |
| POST | `/orders/{id}/push-to-erp` | 推送 ERP，预留接口 |
