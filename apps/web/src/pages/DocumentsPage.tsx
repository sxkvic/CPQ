import { Button, Card, Form, Input, Modal, Space, Switch, Table, Tabs, Tag, message } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import { tableLocale } from '../empty';

type TemplateForm = {
  code: string;
  name: string;
  templateType?: string;
  contentHtml: string;
  isDefault?: boolean;
};

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<TemplateForm>();
  const [messageApi, contextHolder] = message.useMessage();

  const templates = useQuery({
    queryKey: ['document-templates'],
    queryFn: async () => (await api.get('/document-templates')).data,
  });

  const createTemplate = useMutation({
    mutationFn: async (values: TemplateForm) => api.post('/document-templates', values),
    onSuccess: async () => {
      messageApi.success('文档模板已创建');
      setOpen(false);
      form.resetFields();
      await queryClient.invalidateQueries({ queryKey: ['document-templates'] });
    },
  });

  const recentDocuments = useQuery({
    queryKey: ['audit-logs', 'quote_document'],
    queryFn: async () => (await api.get('/audit-logs?keyword=quote_document')).data,
  });

  return (
    <>
      {contextHolder}
      <div className="page-header">
        <h1 className="page-title">文档与模板</h1>
        <Button type="primary" icon={<FileAddOutlined />} onClick={() => setOpen(true)}>
          新建模板
        </Button>
      </div>
      <Tabs
        items={[
          {
            key: 'templates',
            label: '报价模板',
            children: (
              <Card>
                <Table
                  rowKey="id"
                  loading={templates.isLoading}
                  locale={tableLocale}
                  dataSource={templates.data?.items ?? []}
                  columns={[
                    { title: '编码', dataIndex: 'code' },
                    { title: '名称', dataIndex: 'name' },
                    { title: '类型', dataIndex: 'templateType' },
                    { title: '版本', dataIndex: 'version' },
                    { title: '默认', dataIndex: 'isDefault', render: (value) => (value ? <Tag color="green">默认</Tag> : <Tag>否</Tag>) },
                    { title: '状态', dataIndex: 'status' },
                    { title: '更新时间', dataIndex: 'updatedAt' },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'documents',
            label: '生成记录',
            children: (
              <Card>
                <Table
                  rowKey="id"
                  loading={recentDocuments.isLoading}
                  locale={tableLocale}
                  dataSource={recentDocuments.data?.items ?? []}
                  columns={[
                    { title: '动作', dataIndex: 'action' },
                    { title: '资源类型', dataIndex: 'resourceType' },
                    { title: '资源ID', dataIndex: 'resourceId' },
                    { title: '创建时间', dataIndex: 'createdAt' },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title="新建文档模板"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        width={760}
        confirmLoading={createTemplate.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            templateType: 'quote',
            isDefault: false,
            contentHtml:
              '<h1>报价单</h1><p>报价编号：{{quoteNo}} / V{{version}}</p><p>客户：{{customerName}}</p><table><tbody>{{lineItems}}</tbody></table><p>总额：¥{{totalAmount}}</p>',
          }}
          onFinish={(values) => createTemplate.mutate(values)}
        >
          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="code" label="编码" rules={[{ required: true }]} style={{ width: 180 }}>
              <Input />
            </Form.Item>
            <Form.Item name="name" label="名称" rules={[{ required: true }]} style={{ width: 260 }}>
              <Input />
            </Form.Item>
            <Form.Item name="templateType" label="类型" style={{ width: 120 }}>
              <Input />
            </Form.Item>
            <Form.Item name="isDefault" label="设为默认" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item name="contentHtml" label="模板HTML" rules={[{ required: true }]}>
            <Input.TextArea rows={10} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
