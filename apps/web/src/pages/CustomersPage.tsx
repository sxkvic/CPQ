import { Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Tag, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import { tableLocale } from '../empty';

type CustomerForm = {
  code: string;
  name: string;
  industry?: string;
  region?: string;
  grade?: string;
  contactName?: string;
  contactPhone?: string;
};

type CustomerRow = {
  id: string;
  code: string;
  name: string;
  industry?: string;
  region?: string;
  grade?: string;
  status?: string;
  contacts?: Array<{ name: string }>;
};

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [form] = Form.useForm<CustomerForm>();
  const [messageApi, contextHolder] = message.useMessage();

  const customers = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await api.get('/customers')).data,
  });

  const create = useMutation({
    mutationFn: async (values: CustomerForm) =>
      editing ? api.put(`/customers/${editing.id}`, values) : api.post('/customers', values),
    onSuccess: async () => {
      messageApi.success(editing ? '客户已更新' : '客户已创建');
      setOpen(false);
      setEditing(null);
      form.resetFields();
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const disable = useMutation({
    mutationFn: async (id: string) => api.delete(`/customers/${id}`),
    onSuccess: async () => {
      messageApi.success('客户已禁用');
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (record: CustomerRow) => {
    setEditing(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  return (
    <>
      {contextHolder}
      <div className="page-header">
        <h1 className="page-title">客户管理</h1>
        <Button type="primary" onClick={openCreate}>
          新建客户
        </Button>
      </div>
      <Card>
        <Table
          columns={[
            { title: '客户编码', dataIndex: 'code' },
            { title: '客户名称', dataIndex: 'name' },
            { title: '行业', dataIndex: 'industry' },
            { title: '区域', dataIndex: 'region' },
            { title: '等级', dataIndex: 'grade' },
            { title: '状态', dataIndex: 'status', render: (value) => <Tag>{value ?? 'active'}</Tag> },
            { title: '联系人', render: (_, record: CustomerRow) => record.contacts?.[0]?.name },
            {
              title: '操作',
              render: (_, record: CustomerRow) => (
                <Space>
                  <Button type="link" onClick={() => openEdit(record)}>
                    编辑
                  </Button>
                  <Popconfirm title="确认禁用该客户？" onConfirm={() => disable.mutate(record.id)}>
                    <Button type="link" danger>
                      禁用
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          rowKey="id"
          loading={customers.isLoading}
          locale={tableLocale}
          dataSource={customers.data?.items ?? []}
        />
      </Card>
      <Modal
        title={editing ? '编辑客户' : '新建客户'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={create.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(values) => create.mutate(values)}>
          <Form.Item name="code" label="客户编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="客户名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="industry" label="行业">
            <Input />
          </Form.Item>
          <Form.Item name="region" label="区域">
            <Input />
          </Form.Item>
          <Form.Item name="grade" label="客户等级">
            <Input />
          </Form.Item>
          <Form.Item name="contactName" label="主要联系人">
            <Input />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系人电话">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
