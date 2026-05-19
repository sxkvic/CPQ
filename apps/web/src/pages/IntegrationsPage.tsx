import { Button, Card, Form, Input, Modal, Space, Table, Tabs, Tag, message } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import { tableLocale } from '../empty';

type EndpointForm = {
  code: string;
  name: string;
  targetSystem: string;
  eventType: string;
  url?: string;
  authType?: string;
};

type EndpointRow = EndpointForm & {
  id: string;
  status: string;
  lastSyncAt?: string;
  events?: Array<{ id: string }>;
};

type EventRow = {
  id: string;
  resourceType: string;
  resourceId: string;
  eventType: string;
  status: string;
  retryCount: number;
  createdAt: string;
  endpoint?: { name: string };
};

const statusColor: Record<string, string> = {
  pending: 'processing',
  sent: 'green',
  failed: 'red',
};

export function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<EndpointForm>();
  const [messageApi, contextHolder] = message.useMessage();

  const endpoints = useQuery({
    queryKey: ['integration-endpoints'],
    queryFn: async () => (await api.get('/integrations/endpoints')).data,
  });
  const events = useQuery({
    queryKey: ['integration-events'],
    queryFn: async () => (await api.get('/integrations/events')).data,
  });

  const createEndpoint = useMutation({
    mutationFn: async (values: EndpointForm) => api.post('/integrations/endpoints', values),
    onSuccess: async () => {
      messageApi.success('集成端点已创建');
      setOpen(false);
      form.resetFields();
      await queryClient.invalidateQueries({ queryKey: ['integration-endpoints'] });
    },
  });

  const markSent = useMutation({
    mutationFn: async (id: string) => api.post(`/integrations/events/${id}/mark-sent`),
    onSuccess: async () => {
      messageApi.success('事件已标记为发送成功');
      await queryClient.invalidateQueries({ queryKey: ['integration-events'] });
      await queryClient.invalidateQueries({ queryKey: ['integration-endpoints'] });
    },
  });

  const markFailed = useMutation({
    mutationFn: async (id: string) => api.post(`/integrations/events/${id}/mark-failed`, { reason: 'manual retry required' }),
    onSuccess: async () => {
      messageApi.success('事件已标记为失败并安排重试');
      await queryClient.invalidateQueries({ queryKey: ['integration-events'] });
    },
  });

  return (
    <>
      {contextHolder}
      <div className="page-header">
        <h1 className="page-title">集成中心</h1>
        <Button type="primary" icon={<ApiOutlined />} onClick={() => setOpen(true)}>
          新建端点
        </Button>
      </div>
      <Tabs
        items={[
          {
            key: 'endpoints',
            label: '集成端点',
            children: (
              <Card>
                <Table
                  rowKey="id"
                  loading={endpoints.isLoading}
                  locale={tableLocale}
                  dataSource={endpoints.data?.items ?? []}
                  columns={[
                    { title: '编码', dataIndex: 'code' },
                    { title: '名称', dataIndex: 'name' },
                    { title: '目标系统', dataIndex: 'targetSystem' },
                    { title: '事件类型', dataIndex: 'eventType' },
                    { title: 'URL', dataIndex: 'url' },
                    { title: '状态', dataIndex: 'status' },
                    { title: '最近同步', dataIndex: 'lastSyncAt' },
                    { title: '最近事件数', render: (_, record: EndpointRow) => record.events?.length ?? 0 },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'events',
            label: '出站事件',
            children: (
              <Card>
                <Table
                  rowKey="id"
                  loading={events.isLoading}
                  locale={tableLocale}
                  dataSource={events.data?.items ?? []}
                  columns={[
                    { title: '端点', render: (_, record: EventRow) => record.endpoint?.name ?? '未绑定' },
                    { title: '资源', render: (_, record: EventRow) => `${record.resourceType}:${record.resourceId}` },
                    { title: '事件类型', dataIndex: 'eventType' },
                    { title: '重试', dataIndex: 'retryCount' },
                    { title: '状态', dataIndex: 'status', render: (value) => <Tag color={statusColor[value]}>{value}</Tag> },
                    { title: '创建时间', dataIndex: 'createdAt' },
                    {
                      title: '操作',
                      render: (_, record: EventRow) => (
                        <Space>
                          <Button type="link" disabled={record.status === 'sent'} onClick={() => markSent.mutate(record.id)}>
                            标记成功
                          </Button>
                          <Button type="link" danger disabled={record.status === 'failed'} onClick={() => markFailed.mutate(record.id)}>
                            标记失败
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
      <Modal
        title="新建集成端点"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createEndpoint.isPending}
      >
        <Form form={form} layout="vertical" initialValues={{ authType: 'none' }} onFinish={(values) => createEndpoint.mutate(values)}>
          <Form.Item name="code" label="编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="targetSystem" label="目标系统" rules={[{ required: true }]}>
            <Input placeholder="ERP / CRM / 财务系统" />
          </Form.Item>
          <Form.Item name="eventType" label="事件类型" rules={[{ required: true }]}>
            <Input placeholder="order.confirmed" />
          </Form.Item>
          <Form.Item name="url" label="回调地址">
            <Input />
          </Form.Item>
          <Form.Item name="authType" label="认证方式">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
