import {
  Alert,
  Button,
  Card,
  Checkbox,
  Drawer,
  Form,
  InputNumber,
  Popconfirm,
  Radio,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

type AddItemForm = { productId: string; quantity: number; discountRate?: number };
type ProductOptionValue = { id: string; label: string; priceDelta: string; isDefault?: boolean };
type ProductOption = { id: string; code: string; name: string; optionType: string; isRequired: boolean; values: ProductOptionValue[] };
type ProductRow = { id: string; sku: string; name: string; options?: ProductOption[] };
type QuoteItemRow = { id: string; lineNo: number; productNameSnapshot: string; skuSnapshot: string; quantity: number; unitPrice: number; discountRate: number; netAmount: number; taxAmount: number; totalAmount: number; optionConfigJson?: { selectedSummary?: Array<{ optionName: string; valueLabel: string }> } };
type ConfigMessage = { severity: string; message: string };
type QuoteDocumentRow = { id: string; documentNo: string; title: string; status: string; createdAt: string; template?: { name: string } };

function money(value: unknown) {
  return `¥${Number(value ?? 0).toFixed(2)}`;
}

export function QuoteDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<AddItemForm>();
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [messageApi, contextHolder] = message.useMessage();

  const quote = useQuery({ queryKey: ['quote', id], queryFn: async () => (await api.get(`/quotes/${id}`)).data, enabled: Boolean(id) });
  const products = useQuery({ queryKey: ['products', 'select'], queryFn: async () => (await api.get('/products?pageSize=100')).data });
  const auditLogs = useQuery({ queryKey: ['quote-audit-logs', id], queryFn: async () => (await api.get(`/quotes/${id}/audit-logs`)).data, enabled: Boolean(id) });
  const documents = useQuery({ queryKey: ['quote-documents', id], queryFn: async () => (await api.get(`/quotes/${id}/documents`)).data, enabled: Boolean(id) });

  const selectedProductId = Form.useWatch('productId', form);
  const selectedProduct: ProductRow | undefined = useMemo(
    () => products.data?.items?.find((item: ProductRow) => item.id === selectedProductId),
    [products.data?.items, selectedProductId],
  );
  const quantity = Form.useWatch('quantity', form) ?? 1;
  const selectedOptionPayload = Object.entries(selectedOptions).map(([optionId, valueIds]) => ({ optionId, valueIds }));

  const validation = useQuery({
    queryKey: ['configuration-validation', selectedProductId, selectedOptionPayload, quantity],
    queryFn: async () =>
      (await api.post('/quotes/configuration/validate', {
        productId: selectedProductId,
        quantity,
        customerId: quote.data?.customerId,
        selectedOptions: selectedOptionPayload,
      })).data,
    enabled: Boolean(selectedProductId && configOpen),
  });

  const addItem = useMutation({
    mutationFn: async (values: AddItemForm) =>
      api.post(`/quotes/${id}/items`, { ...values, selectedOptions: selectedOptionPayload }),
    onSuccess: async () => {
      messageApi.success('产品已加入报价');
      form.resetFields();
      setSelectedOptions({});
      setConfigOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['quote', id] });
      await queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
  const submit = useMutation({ mutationFn: async () => api.post(`/quotes/${id}/submit`), onSuccess: async () => { messageApi.success('已提交审批'); await queryClient.invalidateQueries({ queryKey: ['quote', id] }); } });
  const markSent = useMutation({ mutationFn: async () => api.post(`/quotes/${id}/mark-sent`), onSuccess: async () => { messageApi.success('已标记为发送客户'); await queryClient.invalidateQueries({ queryKey: ['quote', id] }); } });
  const quoteAction = useMutation({ mutationFn: async (action: 'mark-accepted' | 'mark-rejected' | 'cancel') => api.post(`/quotes/${id}/${action}`), onSuccess: async () => { messageApi.success('报价状态已更新'); await queryClient.invalidateQueries({ queryKey: ['quote', id] }); } });
  const newVersion = useMutation({ mutationFn: async () => api.post(`/quotes/${id}/new-version`), onSuccess: async (response) => { messageApi.success('新版本草稿已创建'); window.location.href = `/quotes/${response.data.id}`; } });
  const convertToOrder = useMutation({ mutationFn: async () => api.post(`/quotes/${id}/convert-to-order`), onSuccess: async () => { messageApi.success('已转为订单'); await queryClient.invalidateQueries({ queryKey: ['quote', id] }); } });
  const generateDocument = useMutation({ mutationFn: async () => api.post(`/quotes/${id}/documents/generate`, {}), onSuccess: async () => { messageApi.success('报价文档已生成'); await queryClient.invalidateQueries({ queryKey: ['quote-documents', id] }); await queryClient.invalidateQueries({ queryKey: ['quote-audit-logs', id] }); } });
  const updateItem = useMutation({ mutationFn: async (values: { itemId: string; quantity?: number; discountRate?: number }) => api.put(`/quotes/items/${values.itemId}`, values), onSuccess: async () => { messageApi.success('明细已更新'); await queryClient.invalidateQueries({ queryKey: ['quote', id] }); } });
  const removeItem = useMutation({ mutationFn: async (itemId: string) => api.delete(`/quotes/items/${itemId}`), onSuccess: async () => { messageApi.success('明细已删除'); await queryClient.invalidateQueries({ queryKey: ['quote', id] }); } });

  const exportHtml = async () => {
    const response = await api.get(`/quotes/${id}/export/html`, { responseType: 'text' });
    const blob = new Blob([response.data], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
  const exportPdf = async () => {
    const { default: html2pdf } = await import('html2pdf.js');
    const response = await api.get(`/quotes/${id}/export/html`, { responseType: 'text' });
    const container = document.createElement('div');
    container.innerHTML = response.data;
    document.body.appendChild(container);
    await html2pdf().set({ margin: 8, filename: `${data?.quoteNo ?? 'quote'}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4' } }).from(container).save();
    document.body.removeChild(container);
  };

  const data = quote.data;
  const hasConfigError = validation.data?.messages?.some((item: ConfigMessage) => item.severity === 'error');

  const openConfig = () => {
    const product = selectedProduct;
    const defaults: Record<string, string[]> = {};
    product?.options?.forEach((option) => {
      const defaultValues = option.values.filter((value) => value.isDefault).map((value) => value.id);
      if (defaultValues.length) defaults[option.id] = defaultValues;
    });
    setSelectedOptions(defaults);
    setConfigOpen(true);
  };

  return (
    <>
      {contextHolder}
      <div className="page-header">
        <div>
          <h1 className="page-title">{data?.quoteNo ?? '报价详情'}</h1>
          <Space><Tag>{data?.status}</Tag><span>{data?.customer?.name}</span></Space>
        </div>
        <Space wrap>
          <Button disabled={!data} onClick={exportHtml}>预览报价单</Button>
          <Button disabled={!data} onClick={exportPdf}>下载PDF</Button>
          <Button disabled={!data} loading={generateDocument.isPending} onClick={() => generateDocument.mutate()}>生成文档快照</Button>
          <Button disabled={!data || data.status !== 'approved'} loading={markSent.isPending} onClick={() => markSent.mutate()}>标记已发送</Button>
          <Button disabled={!data || !['approved', 'sent'].includes(data.status)} onClick={() => quoteAction.mutate('mark-accepted')}>标记接受</Button>
          <Button disabled={!data || !['approved', 'sent'].includes(data.status)} onClick={() => quoteAction.mutate('mark-rejected')}>标记拒绝</Button>
          <Button disabled={!data || !['approved', 'sent', 'accepted', 'rejected'].includes(data.status)} loading={newVersion.isPending} onClick={() => newVersion.mutate()}>创建新版本</Button>
          <Button type="primary" disabled={!data || data.status !== 'accepted'} loading={convertToOrder.isPending} onClick={() => convertToOrder.mutate()}>转订单</Button>
          <Popconfirm title="确认取消该草稿报价？" onConfirm={() => quoteAction.mutate('cancel')}><Button disabled={!data || data.status !== 'draft'} danger>取消报价</Button></Popconfirm>
          <Button type="primary" disabled={!data || data.status !== 'draft'} loading={submit.isPending} onClick={() => submit.mutate()}>提交审批</Button>
        </Space>
      </div>

      <div className="summary-grid">
        <Card><Statistic title="小计" value={data?.subtotalAmount ?? 0} prefix="¥" precision={2} /></Card>
        <Card><Statistic title="税额" value={data?.taxAmount ?? 0} prefix="¥" precision={2} /></Card>
        <Card><Statistic title="总金额" value={data?.totalAmount ?? 0} prefix="¥" precision={2} /></Card>
        <Card><Statistic title="毛利率" value={(Number(data?.grossMarginRate ?? 0) * 100).toFixed(2)} suffix="%" /></Card>
      </div>

      <Card title="添加产品" style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" initialValues={{ quantity: 1, discountRate: 0 }}>
          <Form.Item name="productId" rules={[{ required: true, message: '请选择产品' }]}>
            <Select placeholder="选择产品" style={{ width: 280 }} showSearch optionFilterProp="label" options={(products.data?.items ?? []).map((item: ProductRow) => ({ value: item.id, label: `${item.sku} ${item.name}` }))} />
          </Form.Item>
          <Form.Item name="quantity" rules={[{ required: true }]}><InputNumber min={0.01} placeholder="数量" /></Form.Item>
          <Form.Item name="discountRate"><InputNumber min={0} max={0.99} step={0.01} placeholder="折扣率" /></Form.Item>
          <Button type="primary" disabled={data?.status !== 'draft' || !selectedProductId} onClick={openConfig}>配置并加入</Button>
        </Form>
      </Card>

      <Card>
        <Tabs items={[
          { key: 'items', label: '报价明细', children: <QuoteItemsTable data={data} quoteLoading={quote.isLoading} updateItem={updateItem.mutate} removeItem={removeItem.mutate} /> },
          { key: 'documents', label: '文档记录', children: <Table rowKey="id" loading={documents.isLoading} dataSource={documents.data ?? []} pagination={false} columns={[{ title: '文档编号', dataIndex: 'documentNo' }, { title: '标题', dataIndex: 'title' }, { title: '模板', render: (_, record: QuoteDocumentRow) => record.template?.name }, { title: '状态', dataIndex: 'status' }, { title: '生成时间', dataIndex: 'createdAt' }]} /> },
          { key: 'versions', label: '版本记录', children: <Table rowKey="id" dataSource={data?.versions ?? []} pagination={false} columns={[{ title: '版本', dataIndex: 'version', render: (value) => `V${value}` }, { title: '说明', dataIndex: 'changeNote' }, { title: '创建时间', dataIndex: 'createdAt' }]} /> },
          { key: 'logs', label: '操作日志', children: <Table rowKey="id" loading={auditLogs.isLoading} dataSource={auditLogs.data ?? []} pagination={false} columns={[{ title: '动作', dataIndex: 'action' }, { title: '资源', dataIndex: 'resourceType' }, { title: '时间', dataIndex: 'createdAt' }]} /> },
        ]} />
      </Card>

      <Drawer title="产品配置" width={520} open={configOpen} onClose={() => setConfigOpen(false)}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card size="small" title={selectedProduct ? `${selectedProduct.sku} ${selectedProduct.name}` : '产品'}>
            {(selectedProduct?.options ?? []).map((option) => (
              <div key={option.id} style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>{option.name}{option.isRequired ? <Tag color="red">必选</Tag> : null}</div>
                {option.optionType === 'multiple' ? (
                  <Checkbox.Group
                    value={selectedOptions[option.id] ?? []}
                    options={option.values.map((value) => ({ value: value.id, label: `${value.label}${Number(value.priceDelta) ? ` (${money(value.priceDelta)})` : ''}` }))}
                    onChange={(values) => setSelectedOptions((prev) => ({ ...prev, [option.id]: values.map(String) }))}
                  />
                ) : (
                  <Radio.Group
                    value={selectedOptions[option.id]?.[0]}
                    options={option.values.map((value) => ({ value: value.id, label: `${value.label}${Number(value.priceDelta) ? ` (${money(value.priceDelta)})` : ''}` }))}
                    onChange={(event) => setSelectedOptions((prev) => ({ ...prev, [option.id]: [event.target.value] }))}
                  />
                )}
              </div>
            ))}
          </Card>
          {validation.data?.messages?.map((item: ConfigMessage) => <Alert key={item.message} type={item.severity === 'error' ? 'error' : 'warning'} message={item.message} showIcon />)}
          <Card size="small">
            <Statistic title="选配加价" value={validation.data?.optionPriceDelta ?? 0} prefix="¥" precision={2} />
          </Card>
          <Button type="primary" block disabled={hasConfigError} loading={addItem.isPending} onClick={() => form.validateFields().then((values) => addItem.mutate(values))}>加入报价</Button>
        </Space>
      </Drawer>
    </>
  );
}

function QuoteItemsTable({ data, quoteLoading, updateItem, removeItem }: { data: any; quoteLoading: boolean; updateItem: (values: { itemId: string; quantity?: number; discountRate?: number }) => void; removeItem: (itemId: string) => void }) {
  return (
    <Table
      rowKey="id"
      loading={quoteLoading}
      dataSource={data?.items ?? []}
      pagination={false}
      columns={[
        { title: '行号', dataIndex: 'lineNo' },
        { title: '产品', dataIndex: 'productNameSnapshot' },
        { title: '配置', render: (_, record: QuoteItemRow) => record.optionConfigJson?.selectedSummary?.map((item) => <Tag key={`${item.optionName}-${item.valueLabel}`}>{item.optionName}: {item.valueLabel}</Tag>) },
        { title: '数量', dataIndex: 'quantity', render: (value: number, record: QuoteItemRow) => data?.status === 'draft' ? <InputNumber min={0.01} defaultValue={Number(value)} onBlur={(event) => updateItem({ itemId: record.id, quantity: Number(event.target.value), discountRate: Number(record.discountRate) })} /> : value },
        { title: '单价', dataIndex: 'unitPrice', render: money },
        { title: '折扣率', dataIndex: 'discountRate', render: (value: number, record: QuoteItemRow) => data?.status === 'draft' ? <InputNumber min={0} max={0.99} step={0.01} defaultValue={Number(value)} onBlur={(event) => updateItem({ itemId: record.id, quantity: Number(record.quantity), discountRate: Number(event.target.value) })} /> : value },
        { title: '净额', dataIndex: 'netAmount', render: money },
        { title: '税额', dataIndex: 'taxAmount', render: money },
        { title: '总价', dataIndex: 'totalAmount', render: money },
        { title: '操作', render: (_, record: QuoteItemRow) => data?.status === 'draft' ? <Popconfirm title="确认删除该明细？" onConfirm={() => removeItem(record.id)}><Button type="link" danger>删除</Button></Popconfirm> : null },
      ]}
    />
  );
}
