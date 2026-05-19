import { Button, Card, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select, Space, Statistic, Switch, Table, Tag, message } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { api } from '../api';
import { daysUntil, money, shortDate, statusColor, statusText } from '../cpq-format';
import { tableLocale } from '../empty';

type SubscriptionForm = {
  contractId?: string;
  orderId?: string;
  customerId: string;
  productId: string;
  billingCycle?: string;
  quantity?: number;
  unitPrice?: number;
  startDate: dayjs.Dayjs;
  endDate?: dayjs.Dayjs;
  nextBillingAt?: dayjs.Dayjs;
  autoRenew?: boolean;
  renewalTermMonths?: number;
};

type SubscriptionRow = {
  id: string;
  subscriptionNo: string;
  status: string;
  billingCycle: string;
  quantity: string;
  unitPrice: string;
  startDate: string;
  endDate?: string;
  nextBillingAt?: string;
  autoRenew: boolean;
  customer?: { name: string };
  product?: { sku: string; name: string };
  contract?: { contractNo: string };
};

type OptionRow = {
  id: string;
  code?: string;
  sku?: string;
  name?: string;
  contractNo?: string;
  orderNo?: string;
};

export function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [risk, setRisk] = useState<string>();
  const [form] = Form.useForm<SubscriptionForm>();
  const [messageApi, contextHolder] = message.useMessage();

  const subscriptions = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => (await api.get('/subscriptions')).data,
  });
  const renewalSummary = useQuery({
    queryKey: ['subscriptions-renewal-summary'],
    queryFn: async () => (await api.get('/subscriptions/renewal-summary')).data,
  });
  const customers = useQuery({
    queryKey: ['customers', 'subscription-options'],
    queryFn: async () => (await api.get('/customers?pageSize=100')).data,
  });
  const products = useQuery({
    queryKey: ['products', 'subscription-options'],
    queryFn: async () => (await api.get('/products?pageSize=100')).data,
  });
  const contracts = useQuery({
    queryKey: ['contracts', 'subscription-options'],
    queryFn: async () => (await api.get('/contracts?pageSize=100')).data,
  });
  const orders = useQuery({
    queryKey: ['orders', 'subscription-options'],
    queryFn: async () => (await api.get('/orders?pageSize=100')).data,
  });

  const create = useMutation({
    mutationFn: async (values: SubscriptionForm) =>
      api.post('/subscriptions', {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate?.toISOString(),
        nextBillingAt: values.nextBillingAt?.toISOString(),
      }),
    onSuccess: async () => {
      messageApi.success('订阅已创建');
      setOpen(false);
      form.resetFields();
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      await queryClient.invalidateQueries({ queryKey: ['subscriptions-renewal-summary'] });
    },
  });

  const activate = useMutation({
    mutationFn: async (id: string) => api.post(`/subscriptions/${id}/activate`),
    onSuccess: async () => {
      messageApi.success('订阅已激活');
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      await queryClient.invalidateQueries({ queryKey: ['subscriptions-renewal-summary'] });
    },
  });

  const filteredSubscriptions = useMemo(() => {
    const rows = subscriptions.data?.items ?? [];
    return rows.filter((item: SubscriptionRow) => {
      const text = `${item.subscriptionNo} ${item.customer?.name ?? ''} ${item.product?.sku ?? ''} ${item.product?.name ?? ''} ${item.contract?.contractNo ?? ''}`.toLowerCase();
      const keywordMatched = !keyword || text.includes(keyword.toLowerCase());
      const statusMatched = !status || item.status === status;
      const days = daysUntil(item.nextBillingAt);
      const riskMatched =
        !risk ||
        (risk === 'overdue' && days !== undefined && days < 0) ||
        (risk === 'due30' && days !== undefined && days >= 0 && days <= 30) ||
        (risk === 'noBillingDate' && days === undefined);
      return keywordMatched && statusMatched && riskMatched;
    });
  }, [keyword, risk, status, subscriptions.data?.items]);

  return (
    <>
      {contextHolder}
      <div className="page-header">
        <h1 className="page-title">订阅与续费</h1>
        <Button type="primary" icon={<SyncOutlined />} onClick={() => setOpen(true)}>
          新建订阅
        </Button>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={renewalSummary.isLoading}>
            <Statistic title="逾期账期" value={renewalSummary.data?.overdue ?? 0} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={renewalSummary.isLoading}>
            <Statistic title="30天内到期" value={renewalSummary.data?.dueIn30Days ?? 0} valueStyle={{ color: '#d46b08' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={renewalSummary.isLoading}>
            <Statistic title="90天续费金额" value={money(renewalSummary.data?.amountDueIn90Days)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={renewalSummary.isLoading}>
            <Statistic title="自动续费订阅" value={renewalSummary.data?.autoRenew ?? 0} />
          </Card>
        </Col>
      </Row>
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="搜索订阅、客户、产品或合同"
            onSearch={setKeyword}
            onChange={(event) => !event.target.value && setKeyword('')}
            style={{ width: 320 }}
          />
          <Select
            allowClear
            placeholder="订阅状态"
            value={status}
            onChange={setStatus}
            style={{ width: 160 }}
            options={['pending', 'active', 'suspended', 'expired', 'canceled'].map((value) => ({
              value,
              label: statusText[value],
            }))}
          />
          <Select
            allowClear
            placeholder="续费风险"
            value={risk}
            onChange={setRisk}
            style={{ width: 160 }}
            options={[
              { value: 'overdue', label: '已逾期' },
              { value: 'due30', label: '30天内账期' },
              { value: 'noBillingDate', label: '无账期日期' },
            ]}
          />
        </Space>
        <Table
          rowKey="id"
          loading={subscriptions.isLoading}
          locale={tableLocale}
          dataSource={filteredSubscriptions}
          columns={[
            { title: '订阅编号', dataIndex: 'subscriptionNo' },
            { title: '客户', render: (_, record: SubscriptionRow) => record.customer?.name },
            { title: '产品', render: (_, record: SubscriptionRow) => `${record.product?.sku ?? ''} ${record.product?.name ?? ''}` },
            { title: '合同', render: (_, record: SubscriptionRow) => record.contract?.contractNo },
            { title: '周期', dataIndex: 'billingCycle' },
            { title: '数量', dataIndex: 'quantity' },
            { title: '单价', dataIndex: 'unitPrice', render: money },
            { title: '下次账期', dataIndex: 'nextBillingAt', render: shortDate },
            {
              title: '续费风险',
              render: (_, record: SubscriptionRow) => {
                const days = daysUntil(record.nextBillingAt);
                if (days === undefined) return <Tag color="blue">未设置账期</Tag>;
                if (days < 0) return <Tag color="red">已逾期</Tag>;
                if (days <= 30) return <Tag color="orange">{days}天内账期</Tag>;
                return <Tag color="green">正常</Tag>;
              },
            },
            { title: '自动续费', dataIndex: 'autoRenew', render: (value) => (value ? '是' : '否') },
            { title: '状态', dataIndex: 'status', render: (value) => <Tag color={statusColor[value]}>{statusText[value] ?? value}</Tag> },
            {
              title: '操作',
              render: (_, record: SubscriptionRow) => (
                <Button type="link" disabled={record.status === 'active'} onClick={() => activate.mutate(record.id)}>
                  激活
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="新建订阅"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        width={720}
        confirmLoading={create.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ billingCycle: 'monthly', quantity: 1, autoRenew: false, renewalTermMonths: 12 }}
          onFinish={(values) => create.mutate(values)}
        >
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="customerId" label="客户" rules={[{ required: true }]} style={{ width: 320 }}>
              <Select
                showSearch
                optionFilterProp="label"
                options={(customers.data?.items ?? []).map((item: OptionRow) => ({
                  value: item.id,
                  label: `${item.code} ${item.name}`,
                }))}
              />
            </Form.Item>
            <Form.Item name="productId" label="产品" rules={[{ required: true }]} style={{ width: 320 }}>
              <Select
                showSearch
                optionFilterProp="label"
                options={(products.data?.items ?? []).map((item: OptionRow) => ({
                  value: item.id,
                  label: `${item.sku} ${item.name}`,
                }))}
              />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="contractId" label="合同" style={{ width: 320 }}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={(contracts.data?.items ?? []).map((item: OptionRow) => ({
                  value: item.id,
                  label: item.contractNo,
                }))}
              />
            </Form.Item>
            <Form.Item name="orderId" label="订单" style={{ width: 320 }}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={(orders.data?.items ?? []).map((item: OptionRow) => ({
                  value: item.id,
                  label: item.orderNo,
                }))}
              />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="billingCycle" label="计费周期" style={{ width: 160 }}>
              <Select
                options={[
                  { value: 'monthly', label: '月付' },
                  { value: 'quarterly', label: '季付' },
                  { value: 'annual', label: '年付' },
                ]}
              />
            </Form.Item>
            <Form.Item name="quantity" label="数量" style={{ width: 140 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="unitPrice" label="单价" style={{ width: 160 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="autoRenew" label="自动续费" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="startDate" label="开始日期" rules={[{ required: true }]} style={{ width: 210 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endDate" label="结束日期" style={{ width: 210 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="nextBillingAt" label="下次账期" style={{ width: 210 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  );
}
