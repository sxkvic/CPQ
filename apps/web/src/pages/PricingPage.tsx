import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Upload, message } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import { downloadBase64File, readFileAsBase64 } from '../file-utils';
import { tableLocale } from '../empty';

type PriceBookForm = {
  code: string;
  name: string;
  currency?: string;
  region?: string;
};

type PriceItemForm = {
  priceBookId: string;
  productId: string;
  unitPrice: number;
  costPrice?: number;
};

type ProductOption = {
  id: string;
  sku: string;
  name: string;
};

type PriceBookRow = {
  id: string;
  code: string;
  name: string;
  currency: string;
  region?: string;
  status: string;
  items?: Array<{ id: string }>;
};

export function PricingPage() {
  const queryClient = useQueryClient();
  const [bookOpen, setBookOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [bookForm] = Form.useForm<PriceBookForm>();
  const [itemForm] = Form.useForm<PriceItemForm>();
  const [messageApi, contextHolder] = message.useMessage();

  const priceBooks = useQuery({
    queryKey: ['price-books'],
    queryFn: async () => (await api.get('/price-books')).data,
  });
  const products = useQuery({
    queryKey: ['products', 'pricing'],
    queryFn: async () => (await api.get('/products?pageSize=100')).data,
  });

  const createBook = useMutation({
    mutationFn: async (values: PriceBookForm) => api.post('/price-books', values),
    onSuccess: async () => {
      messageApi.success('价格本已创建');
      setBookOpen(false);
      bookForm.resetFields();
      await queryClient.invalidateQueries({ queryKey: ['price-books'] });
    },
  });

  const addItem = useMutation({
    mutationFn: async (values: PriceItemForm) =>
      api.post(`/price-books/${values.priceBookId}/items`, {
        productId: values.productId,
        unitPrice: values.unitPrice,
        costPrice: values.costPrice,
      }),
    onSuccess: async () => {
      messageApi.success('价格明细已添加');
      setItemOpen(false);
      itemForm.resetFields();
      await queryClient.invalidateQueries({ queryKey: ['price-books'] });
    },
  });

  const exportItems = async (priceBookId: string) => {
    const response = await api.get(`/price-books/${priceBookId}/items/export/excel`);
    downloadBase64File(
      response.data.fileName,
      response.data.fileBase64,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  };

  const importItems = async (priceBookId: string, file: File) => {
    const fileBase64 = await readFileAsBase64(file);
    const response = await api.post(`/price-books/${priceBookId}/items/import/excel`, { fileBase64 });
    messageApi.success(`导入完成：${response.data.imported} 条，跳过：${response.data.skipped} 条`);
    await queryClient.invalidateQueries({ queryKey: ['price-books'] });
  };

  return (
    <>
      {contextHolder}
      <div className="page-header">
        <h1 className="page-title">价格管理</h1>
        <div>
          <Button style={{ marginRight: 8 }} onClick={() => setItemOpen(true)}>
            添加价格明细
          </Button>
          <Button type="primary" onClick={() => setBookOpen(true)}>
            新建价格本
          </Button>
        </div>
      </div>
      <Card>
        <Table
          rowKey="id"
          loading={priceBooks.isLoading}
          locale={tableLocale}
          dataSource={priceBooks.data?.items ?? []}
          columns={[
            { title: '编码', dataIndex: 'code' },
            { title: '名称', dataIndex: 'name' },
            { title: '币种', dataIndex: 'currency' },
            { title: '区域', dataIndex: 'region' },
            { title: '状态', dataIndex: 'status' },
            { title: '价格明细数', render: (_, record: PriceBookRow) => record.items?.length ?? 0 },
            {
              title: '导入导出',
              render: (_, record: PriceBookRow) => (
                <Space>
                  <Button type="link" icon={<DownloadOutlined />} onClick={() => exportItems(record.id)}>
                    导出
                  </Button>
                  <Upload
                    accept=".xlsx"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      void importItems(record.id, file);
                      return false;
                    }}
                  >
                    <Button type="link" icon={<UploadOutlined />}>
                      导入
                    </Button>
                  </Upload>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="新建价格本"
        open={bookOpen}
        onCancel={() => setBookOpen(false)}
        onOk={() => bookForm.submit()}
        confirmLoading={createBook.isPending}
      >
        <Form
          form={bookForm}
          layout="vertical"
          initialValues={{ currency: 'CNY' }}
          onFinish={(values) => createBook.mutate(values)}
        >
          <Form.Item name="code" label="编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="currency" label="币种">
            <Input />
          </Form.Item>
          <Form.Item name="region" label="区域">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加价格明细"
        open={itemOpen}
        onCancel={() => setItemOpen(false)}
        onOk={() => itemForm.submit()}
        confirmLoading={addItem.isPending}
      >
        <Form form={itemForm} layout="vertical" onFinish={(values) => addItem.mutate(values)}>
          <Form.Item name="priceBookId" label="价格本" rules={[{ required: true }]}>
            <Select
              options={(priceBooks.data?.items ?? []).map((item: PriceBookRow) => ({
                value: item.id,
                label: `${item.code} ${item.name}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="productId" label="产品" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={(products.data?.items ?? []).map((item: ProductOption) => ({
                value: item.id,
                label: `${item.sku} ${item.name}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="unitPrice" label="销售单价" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="costPrice" label="成本价">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
