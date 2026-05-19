import { Button, Card, Input, Select, Space, Table, Tag, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { money, shortDate, statusColor, statusText } from '../cpq-format';
import { tableLocale } from '../empty';

type OrderRow = {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  customer?: { name: string };
  quote?: { quoteNo: string };
};

export function OrdersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [messageApi, contextHolder] = message.useMessage();

  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders')).data,
  });

  const confirm = useMutation({
    mutationFn: async (id: string) => api.post(`/orders/${id}/confirm`),
    onSuccess: async () => {
      messageApi.success('订单已确认，并已生成合同草稿和集成事件');
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const filteredOrders = useMemo(() => {
    const rows = orders.data?.items ?? [];
    return rows.filter((item: OrderRow) => {
      const text = `${item.orderNo} ${item.customer?.name ?? ''} ${item.quote?.quoteNo ?? ''}`.toLowerCase();
      const keywordMatched = !keyword || text.includes(keyword.toLowerCase());
      const statusMatched = !status || item.status === status;
      return keywordMatched && statusMatched;
    });
  }, [keyword, orders.data?.items, status]);

  return (
    <>
      {contextHolder}
      <div className="page-header">
        <h1 className="page-title">订单管理</h1>
      </div>
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="搜索订单、报价或客户"
            onSearch={setKeyword}
            onChange={(event) => !event.target.value && setKeyword('')}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            placeholder="订单状态"
            value={status}
            onChange={setStatus}
            style={{ width: 160 }}
            options={['created', 'confirmed'].map((value) => ({ value, label: statusText[value] }))}
          />
        </Space>
        <Table
          rowKey="id"
          loading={orders.isLoading}
          locale={tableLocale}
          dataSource={filteredOrders}
          columns={[
            { title: '订单编号', dataIndex: 'orderNo' },
            { title: '来源报价', render: (_, record: OrderRow) => record.quote?.quoteNo },
            { title: '客户', render: (_, record: OrderRow) => record.customer?.name },
            { title: '总金额', dataIndex: 'totalAmount', render: money },
            { title: '状态', dataIndex: 'status', render: (value) => <Tag color={statusColor[value]}>{statusText[value] ?? value}</Tag> },
            { title: '创建时间', dataIndex: 'createdAt', render: shortDate },
            {
              title: '下一步',
              render: (_, record: OrderRow) => (record.status === 'created' ? '确认订单' : '签署合同 / 同步ERP'),
            },
            {
              title: '操作',
              render: (_, record: OrderRow) => (
                <Space>
                  <Button
                    type="link"
                    disabled={record.status !== 'created'}
                    onClick={() => confirm.mutate(record.id)}
                  >
                    确认订单
                  </Button>
                  <Button type="link" disabled={record.status !== 'confirmed'} onClick={() => navigate('/contracts')}>
                    查看合同
                  </Button>
                  <Button type="link" disabled={record.status !== 'confirmed'} onClick={() => navigate('/integrations')}>
                    集成事件
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
