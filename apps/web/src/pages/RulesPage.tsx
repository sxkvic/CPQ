import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import { tableLocale } from '../empty';

type ProductOption = {
  id: string;
  sku: string;
  name: string;
};

type RuleForm = {
  productId: string;
  code: string;
  name: string;
  ruleType: string;
  conditionJsonText: string;
  actionJsonText: string;
  message: string;
  severity: string;
};

type RuleRow = {
  id: string;
  productId: string;
  code: string;
  name: string;
  ruleType: string;
  conditionJson: Record<string, unknown>;
  actionJson: Record<string, unknown>;
  message: string;
  severity: string;
  status: string;
  product?: { sku: string; name: string };
};

const defaultCondition = JSON.stringify({ selectedOption: 'POWER_HIGH' }, null, 2);
const defaultAction = JSON.stringify({ requireOption: 'COOLING_PLUS' }, null, 2);

export function RulesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RuleRow | null>(null);
  const [form] = Form.useForm<RuleForm>();
  const [messageApi, contextHolder] = message.useMessage();

  const rules = useQuery({
    queryKey: ['configuration-rules'],
    queryFn: async () => (await api.get('/configuration-rules')).data,
  });
  const products = useQuery({
    queryKey: ['products', 'rules'],
    queryFn: async () => (await api.get('/products?pageSize=100')).data,
  });

  const saveRule = useMutation({
    mutationFn: async (values: RuleForm) => {
      const payload = {
        productId: values.productId,
        code: values.code,
        name: values.name,
        ruleType: values.ruleType,
        conditionJson: JSON.parse(values.conditionJsonText),
        actionJson: JSON.parse(values.actionJsonText),
        message: values.message,
        severity: values.severity,
      };
      return editing
        ? api.put(`/configuration-rules/${editing.id}`, payload)
        : api.post('/configuration-rules', payload);
    },
    onSuccess: async () => {
      messageApi.success(editing ? '规则已更新' : '规则已创建');
      setOpen(false);
      setEditing(null);
      form.resetFields();
      await queryClient.invalidateQueries({ queryKey: ['configuration-rules'] });
    },
    onError: () => messageApi.error('保存失败，请检查 JSON 格式'),
  });

  const toggleRule = useMutation({
    mutationFn: async (id: string) => api.post(`/configuration-rules/${id}/toggle`),
    onSuccess: async () => {
      messageApi.success('规则状态已更新');
      await queryClient.invalidateQueries({ queryKey: ['configuration-rules'] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      ruleType: 'require',
      severity: 'error',
      conditionJsonText: defaultCondition,
      actionJsonText: defaultAction,
    });
    setOpen(true);
  };

  const openEdit = (record: RuleRow) => {
    setEditing(record);
    form.setFieldsValue({
      productId: record.productId,
      code: record.code,
      name: record.name,
      ruleType: record.ruleType,
      conditionJsonText: JSON.stringify(record.conditionJson, null, 2),
      actionJsonText: JSON.stringify(record.actionJson, null, 2),
      message: record.message,
      severity: record.severity,
    });
    setOpen(true);
  };

  return (
    <>
      {contextHolder}
      <div className="page-header">
        <h1 className="page-title">配置规则</h1>
        <Button type="primary" onClick={openCreate}>
          新建规则
        </Button>
      </div>
      <Card>
        <Table
          rowKey="id"
          loading={rules.isLoading}
          locale={tableLocale}
          dataSource={rules.data?.items ?? []}
          columns={[
            { title: '编码', dataIndex: 'code' },
            { title: '名称', dataIndex: 'name' },
            {
              title: '产品',
              render: (_, record: RuleRow) =>
                `${record.product?.sku ?? ''} ${record.product?.name ?? ''}`,
            },
            { title: '类型', dataIndex: 'ruleType' },
            { title: '提示', dataIndex: 'message' },
            { title: '级别', dataIndex: 'severity', render: (value) => <Tag>{value}</Tag> },
            { title: '状态', dataIndex: 'status', render: (value) => <Tag>{value}</Tag> },
            {
              title: '操作',
              render: (_, record: RuleRow) => (
                <Space>
                  <Button type="link" onClick={() => openEdit(record)}>
                    编辑
                  </Button>
                  <Button type="link" onClick={() => toggleRule.mutate(record.id)}>
                    {record.status === 'active' ? '停用' : '启用'}
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editing ? '编辑配置规则' : '新建配置规则'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveRule.isPending}
        width={760}
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveRule.mutate(values)}>
          <Form.Item name="productId" label="适用产品" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={(products.data?.items ?? []).map((item: ProductOption) => ({
                value: item.id,
                label: `${item.sku} ${item.name}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="code" label="规则编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="ruleType" label="规则类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'require', label: '依赖必选' },
                { value: 'exclude', label: '互斥禁选' },
                { value: 'quantity', label: '数量限制' },
                { value: 'region', label: '区域限制' },
              ]}
            />
          </Form.Item>
          <Form.Item name="conditionJsonText" label="触发条件 JSON" rules={[{ required: true }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="actionJsonText" label="执行动作 JSON" rules={[{ required: true }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="message" label="提示信息" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="severity" label="严重级别">
            <Select
              options={[
                { value: 'error', label: '错误' },
                { value: 'warning', label: '警告' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
