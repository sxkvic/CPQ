import { Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { FileProtectOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { api } from '../api';
import { daysUntil, money, shortDate, statusColor, statusText } from '../cpq-format';
import { tableLocale } from '../empty';

type ContractForm = {
  customerId: string;
  quoteId?: string;
  orderId?: string;
  startDate?: dayjs.Dayjs;
  endDate?: dayjs.Dayjs;
  paymentTerms?: string;
  deliveryTerms?: string;
};

type ContractRow = {
  id: string;
  contractNo: string;
  status: string;
  totalAmount: string;
  startDate?: string;
  endDate?: string;
  customer?: { name: string };
  quote?: { quoteNo: string };
  order?: { orderNo: string };
  subscriptions?: Array<{ id: string }>;
};

type CustomerOption = {
  id: string;
  code: string;
  name: string;
};

type QuoteOption = {
  id: string;
  quoteNo: string;
  customerId: string;
};

type OrderOption = {
  id: string;
  orderNo: string;
  customerId: string;
};

export function ContractsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [form] = Form.useForm<ContractForm>();
  const [messageApi, contextHolder] = message.useMessage();

  const contracts = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => (await api.get('/contracts')).data,
  });
  const customers = useQuery({
    queryKey: ['customers', 'contract-options'],
    queryFn: async () => (await api.get('/customers?pageSize=100')).data,
  });
  const quotes = useQuery({
    queryKey: ['quotes', 'contract-options'],
    queryFn: async () => (await api.get('/quotes?pageSize=100')).data,
  });
  const orders = useQuery({
    queryKey: ['orders', 'contract-options'],
    queryFn: async () => (await api.get('/orders?pageSize=100')).data,
  });

  const create = useMutation({
    mutationFn: async (values: ContractForm) =>
      api.post('/contracts', {
        ...values,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
      }),
    onSuccess: async () => {
      messageApi.success('合同已创建');
      setOpen(false);
      form.resetFields();
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });

  const sign = useMutation({
    mutationFn: async (id: string) => api.post(`/contracts/${id}/sign`),
    onSuccess: async () => {
      messageApi.success('合同已生效，软件类明细已生成订阅');
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const terminate = useMutation({
    mutationFn: async (id: string) => api.post(`/contracts/${id}/terminate`),
    onSuccess: async () => {
      messageApi.success('合同已终止');
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });

  const filteredContracts = useMemo(() => {
    const rows = contracts.data?.items ?? [];
    return rows.filter((item: ContractRow) => {
      const text = `${item.contractNo} ${item.customer?.name ?? ''} ${item.quote?.quoteNo ?? ''} ${item.order?.orderNo ?? ''}`.toLowerCase();
      const keywordMatched = !keyword || text.includes(keyword.toLowerCase());
      const statusMatched = !status || item.status === status;
      return keywordMatched && statusMatched;
    });
  }, [contracts.data?.items, keyword, status]);

  return (
    <>
      {contextHolder}
      <div className="page-header">
        <h1 className="page-title">合同管理</h1>
        <Button type="primary" icon={<FileProtectOutlined />} onClick={() => setOpen(true)}>
          新建合同
        </Button>
      </div>
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="搜索合同、客户、报价或订单"
            onSearch={setKeyword}
            onChange={(event) => !event.target.value && setKeyword('')}
            style={{ width: 320 }}
          />
          <Select
            allowClear
            placeholder="合同状态"
            value={status}
            onChange={setStatus}
            style={{ width: 160 }}
            options={['draft', 'pending_signature', 'active', 'expired', 'terminated'].map((value) => ({
              value,
              label: statusText[value],
            }))}
          />
        </Space>
        <Table
          rowKey="id"
          loading={contracts.isLoading}
          locale={tableLocale}
          dataSource={filteredContracts}
          columns={[
            { title: '合同编号', dataIndex: 'contractNo' },
            { title: '客户', render: (_, record: ContractRow) => record.customer?.name },
            { title: '来源报价', render: (_, record: ContractRow) => record.quote?.quoteNo },
            { title: '来源订单', render: (_, record: ContractRow) => record.order?.orderNo },
            { title: '总金额', dataIndex: 'totalAmount', render: money },
            { title: '订阅数', render: (_, record: ContractRow) => record.subscriptions?.length ?? 0 },
            { title: '状态', dataIndex: 'status', render: (value) => <Tag color={statusColor[value]}>{statusText[value] ?? value}</Tag> },
            { title: '开始日期', dataIndex: 'startDate', render: shortDate },
            { title: '结束日期', dataIndex: 'endDate', render: shortDate },
            {
              title: '风险',
              render: (_, record: ContractRow) => {
                const days = daysUntil(record.endDate);
                if (record.status === 'terminated') return <Tag>已关闭</Tag>;
                if (days === undefined) return <Tag color="blue">未设置到期日</Tag>;
                if (days < 0) return <Tag color="red">已过期</Tag>;
                if (days <= 30) return <Tag color="orange">{days}天内到期</Tag>;
                return <Tag color="green">正常</Tag>;
              },
            },
            {
              title: '操作',
              render: (_, record: ContractRow) => (
                <Space>
                  <Button type="link" disabled={record.status === 'active'} onClick={() => sign.mutate(record.id)}>
                    签署生效
                  </Button>
                  <Button type="link" danger disabled={record.status === 'terminated'} onClick={() => terminate.mutate(record.id)}>
                    终止
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="新建合同"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={create.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(values) => create.mutate(values)}>
          <Form.Item name="customerId" label="客户" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={(customers.data?.items ?? []).map((item: CustomerOption) => ({
                value: item.id,
                label: `${item.code} ${item.name}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="quoteId" label="来源报价">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={(quotes.data?.items ?? []).map((item: QuoteOption) => ({
                value: item.id,
                label: item.quoteNo,
              }))}
            />
          </Form.Item>
          <Form.Item name="orderId" label="来源订单">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={(orders.data?.items ?? []).map((item: OrderOption) => ({
                value: item.id,
                label: item.orderNo,
              }))}
            />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="startDate" label="开始日期" style={{ width: 220 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endDate" label="结束日期" style={{ width: 220 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="paymentTerms" label="付款条款">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="deliveryTerms" label="交付条款">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
