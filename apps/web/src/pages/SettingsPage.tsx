import { Button, Card, Form, Input, message } from 'antd';
import { useEffect } from 'react';

type TemplateForm = {
  companyName: string;
  companyPhone: string;
  paymentTerms: string;
  deliveryTerms: string;
  footerNote: string;
};

const storageKey = 'cpq_quote_template_settings';

export function SettingsPage() {
  const [form] = Form.useForm<TemplateForm>();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      form.setFieldsValue(JSON.parse(raw));
      return;
    }
    form.setFieldsValue({
      companyName: '示例科技有限公司',
      companyPhone: '400-000-0000',
      paymentTerms: '预付30%，发货前付70%',
      deliveryTerms: '30个工作日内交付',
      footerNote: '本报价有效期以报价单标注为准。',
    });
  }, [form]);

  const save = (values: TemplateForm) => {
    localStorage.setItem(storageKey, JSON.stringify(values));
    messageApi.success('报价模板设置已保存');
  };

  return (
    <>
      {contextHolder}
      <div className="page-header">
        <h1 className="page-title">系统设置</h1>
      </div>
      <Card title="报价模板设置">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="companyName" label="公司名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="companyPhone" label="联系电话">
            <Input />
          </Form.Item>
          <Form.Item name="paymentTerms" label="默认付款条款">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="deliveryTerms" label="默认交付条款">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="footerNote" label="页脚说明">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            保存设置
          </Button>
        </Form>
      </Card>
    </>
  );
}
