import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Upload, message } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import { downloadBase64File, readFileAsBase64 } from '../file-utils';
import { tableLocale } from '../empty';

type ProductForm = {
  sku: string;
  name: string;
  productType: string;
  unit: string;
  standardCost?: number;
  standardPrice: number;
  description?: string;
};

type ProductRow = ProductForm & {
  id: string;
  status: string;
};

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form] = Form.useForm<ProductForm>();
  const [messageApi, contextHolder] = message.useMessage();

  const products = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/products')).data,
  });

  const create = useMutation({
    mutationFn: async (values: ProductForm) =>
      editing ? api.put(`/products/${editing.id}`, values) : api.post('/products', values),
    onSuccess: async () => {
      messageApi.success(editing ? '产品已更新' : '产品已创建');
      setOpen(false);
      setEditing(null);
      form.resetFields();
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async (record: ProductRow) =>
      api.post(`/products/${record.id}/${record.status === 'active' ? 'deactivate' : 'activate'}`),
    onSuccess: async () => {
      messageApi.success('产品状态已更新');
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const exportExcel = async () => {
    const response = await api.get('/products/export/excel');
    downloadBase64File(
      response.data.fileName,
      response.data.fileBase64,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  };

  const importExcel = async (file: File) => {
    const fileBase64 = await readFileAsBase64(file);
    const response = await api.post('/products/import/excel', { fileBase64 });
    messageApi.success(`导入完成：${response.data.imported} 条`);
    await queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ productType: 'physical', unit: '套' });
    setOpen(true);
  };

  const openEdit = (record: ProductRow) => {
    setEditing(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  return (
    <>
      {contextHolder}
      <div className="page-header">
        <h1 className="page-title">产品管理</h1>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={exportExcel}>
            导出Excel
          </Button>
          <Upload
            accept=".xlsx"
            showUploadList={false}
            beforeUpload={(file) => {
              void importExcel(file);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>导入Excel</Button>
          </Upload>
          <Button type="primary" onClick={openCreate}>
            新建产品
          </Button>
        </Space>
      </div>
      <Card>
        <Table
          rowKey="id"
          loading={products.isLoading}
          locale={tableLocale}
          dataSource={products.data?.items ?? []}
          columns={[
            { title: 'SKU', dataIndex: 'sku' },
            { title: '产品名称', dataIndex: 'name' },
            { title: '类型', dataIndex: 'productType' },
            { title: '单位', dataIndex: 'unit' },
            { title: '标准售价', dataIndex: 'standardPrice', render: (value) => `¥${value}` },
            { title: '状态', dataIndex: 'status', render: (value) => <Tag>{value}</Tag> },
            {
              title: '操作',
              render: (_, record: ProductRow) => (
                <Space>
                  <Button type="link" onClick={() => openEdit(record)}>
                    编辑
                  </Button>
                  <Popconfirm
                    title={record.status === 'active' ? '确认停用该产品？' : '确认启用该产品？'}
                    onConfirm={() => toggleStatus.mutate(record)}
                  >
                    <Button type="link" danger={record.status === 'active'}>
                      {record.status === 'active' ? '停用' : '启用'}
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        title={editing ? '编辑产品' : '新建产品'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={create.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ productType: 'physical', unit: '套' }}
          onFinish={(values) => create.mutate(values)}
        >
          <Form.Item name="sku" label="SKU" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="产品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="productType" label="产品类型">
            <Select
              options={[
                { value: 'physical', label: '实物产品' },
                { value: 'software', label: '软件' },
                { value: 'service', label: '服务' },
                { value: 'bundle', label: '套餐' },
              ]}
            />
          </Form.Item>
          <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="standardPrice" label="标准售价" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="standardCost" label="标准成本">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
