import { Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { money, percent, statusColor, statusText } from '../cpq-format';
import { tableLocale } from '../empty';

type QuoteForm = {
  customerId: string;
  contactId?: string;
  validUntil?: dayjs.Dayjs;
};

type CustomerOption = {
  id: string;
  name: string;
  contacts?: Array<{ id: string; name: string }>;
};

type QuoteRow = {
  id: string;
  quoteNo: string;
  version: number;
  totalAmount: string;
  grossMarginRate: string;
  status: string;
  customer?: { name: string };
};

const nextAction: Record<string, string> = {
  draft: '补齐明细并提交审批',
  pending_approval: '等待审批处理',
  approved: '生成文档并发送客户',
  sent: '跟进客户接受或拒绝',
  accepted: '转换为订单',
  converted: '进入订单/合同履约',
  rejected: '复盘原因或创建新版本',
  canceled: '已结束',
};

export function QuotesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [form] = Form.useForm<QuoteForm>();
  const [messageApi, contextHolder] = message.useMessage();

  const quotes = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => (await api.get('/quotes')).data,
  });

  const customers = useQuery({
    queryKey: ['customers', 'select'],
    queryFn: async () => (await api.get('/customers?pageSize=100')).data,
  });

  const selectedCustomerId = Form.useWatch('customerId', form);
  const selectedCustomer = customers.data?.items?.find(
    (item: CustomerOption) => item.id === selectedCustomerId,
  );

  const filteredQuotes = useMemo(() => {
    const rows = quotes.data?.items ?? [];
    return rows.filter((item: QuoteRow) => {
      const text = `${item.quoteNo} ${item.customer?.name ?? ''}`.toLowerCase();
      const keywordMatched = !keyword || text.includes(keyword.toLowerCase());
      const statusMatched = !status || item.status === status;
      return keywordMatched && statusMatched;
    });
  }, [keyword, quotes.data?.items, status]);

  const create = useMutation({
    mutationFn: async (values: QuoteForm) =>
      api.post('/quotes', {
        ...values,
        validUntil: values.validUntil?.format('YYYY-MM-DD'),
      }),
    onSuccess: async (response) => {
      messageApi.success('报价草稿已创建');
      setOpen(false);
      form.resetFields();
      await queryClient.invalidateQueries({ queryKey: ['quotes'] });
      navigate(`/quotes/${response.data.id}`);
    },
  });

  return (
    <>
      {contextHolder}
      <div className="page-header">
        <h1 className="page-title">报价管理</h1>
        <Button type="primary" onClick={() => setOpen(true)}>
          新建报价
        </Button>
      </div>
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="搜索报价编号或客户"
            onSearch={setKeyword}
            onChange={(event) => !event.target.value && setKeyword('')}
            style={{ width: 260 }}
          />
          <Select
            allowClear
            placeholder="报价状态"
            value={status}
            onChange={setStatus}
            style={{ width: 180 }}
            options={[
              'draft',
              'pending_approval',
              'approved',
              'sent',
              'accepted',
              'converted',
              'rejected',
              'canceled',
            ].map((value) => ({ value, label: statusText[value] }))}
          />
        </Space>
        <Table
          rowKey="id"
          loading={quotes.isLoading}
          locale={tableLocale}
          dataSource={filteredQuotes}
          onRow={(record: QuoteRow) => ({ onClick: () => navigate(`/quotes/${record.id}`) })}
          columns={[
            { title: '报价编号', dataIndex: 'quoteNo' },
            { title: '客户', render: (_, record: QuoteRow) => record.customer?.name },
            { title: '版本', dataIndex: 'version' },
            { title: '总金额', dataIndex: 'totalAmount', render: money },
            {
              title: '毛利率',
              dataIndex: 'grossMarginRate',
              render: (value: string) => {
                const rate = Number(value);
                return <Tag color={rate < 0.15 ? 'red' : rate < 0.25 ? 'orange' : 'green'}>{percent(value)}</Tag>;
              },
            },
            {
              title: '状态',
              dataIndex: 'status',
              render: (value: string) => <Tag color={statusColor[value]}>{statusText[value] ?? value}</Tag>,
            },
            {
              title: '下一步',
              dataIndex: 'status',
              render: (value: string) => nextAction[value] ?? '查看详情',
            },
          ]}
        />
      </Card>
      <Modal
        title="新建报价"
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
                label: item.name,
              }))}
            />
          </Form.Item>
          <Form.Item name="contactId" label="联系人">
            <Select
              allowClear
              options={(selectedCustomer?.contacts ?? []).map((item: { id: string; name: string }) => ({
                value: item.id,
                label: item.name,
              }))}
            />
          </Form.Item>
          <Form.Item name="validUntil" label="有效期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
